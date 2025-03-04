import browser from 'webextension-polyfill';
import { defaultWorkflow, useWorkflowStore } from '@/stores/workflow';
import { registerWorkflowTrigger } from './workflowTrigger';
import {
  parseJSON,
  fileSaver,
  openFilePicker,
  findTriggerBlock,
} from './helper';

const contextMenuPermission =
  BROWSER_TYPE === 'firefox' ? 'menus' : 'contextMenus';
const checkPermission = (permissions) =>
  browser.permissions.contains({ permissions });
const requiredPermissions = {
  trigger: {
    name: contextMenuPermission,
    hasPermission({ data }) {
      const permissions = [];

      if (data.triggers) {
        data.triggers.forEach((trigger) => {
          if (trigger.type !== 'context-menu') return;

          permissions.push(contextMenuPermission);
        });
      } else if (data.type === 'context-menu') {
        permissions.push(contextMenuPermission);
      }

      return checkPermission(permissions);
    },
  },
  clipboard: {
    name: 'clipboardRead',
    hasPermission() {
      const clipboardPermissions = ['clipboardRead'];
      if (BROWSER_TYPE === 'firefox')
        clipboardPermissions.push('clipboardWrite');

      return checkPermission(clipboardPermissions);
    },
  },
  notification: {
    name: 'notifications',
    hasPermission() {
      return checkPermission(['notifications']);
    },
  },
  'handle-download': {
    name: 'downloads',
    hasPermission() {
      return checkPermission(['downloads']);
    },
  },
  'save-assets': {
    name: 'downloads',
    hasPermission() {
      return checkPermission(['downloads']);
    },
  },
  cookie: {
    name: 'cookies',
    hasPermission() {
      return checkPermission(['cookies']);
    },
  },
};

export async function getWorkflowPermissions(drawflow) {
  let blocks = [];
  const permissions = [];
  const drawflowData =
    typeof drawflow === 'string' ? parseJSON(drawflow) : drawflow;

  if (drawflowData.nodes) {
    blocks = drawflowData.nodes;
  } else {
    blocks = Object.values(drawflowData.drawflow?.Home?.data || {});
  }

  for (const block of blocks) {
    const name = block.label || block.name;
    const permission = requiredPermissions[name];

    if (permission && !permissions.includes(permission.name)) {
      const hasPermission = await permission.hasPermission(block);
      if (!hasPermission) permissions.push(permission.name);
    }
  }

  return permissions;
}

export function importWorkflow(attrs = {}) {
  return new Promise((resolve, reject) => {
    openFilePicker(['application/json'], attrs)
      .then((files) => {
        const handleOnLoadReader = ({ target }) => {
          const workflow = JSON.parse(target.result);
          const workflowStore = useWorkflowStore();

          if (workflow.includedWorkflows) {
            Object.keys(workflow.includedWorkflows).forEach((workflowId) => {
              const isWorkflowExists = Boolean(
                workflowStore.workflows[workflowId]
              );

              if (isWorkflowExists) return;

              const currentWorkflow = workflow.includedWorkflows[workflowId];
              currentWorkflow.table =
                currentWorkflow.table || currentWorkflow.dataColumns;
              delete currentWorkflow.dataColumns;

              workflowStore.insert(
                {
                  ...currentWorkflow,
                  id: workflowId,
                  createdAt: Date.now(),
                },
                { duplicateId: true }
              );
            });

            delete workflow.includedWorkflows;
          }

          workflow.table = workflow.table || workflow.dataColumns;
          delete workflow.dataColumns;

          if (typeof workflow.drawflow === 'string') {
            workflow.drawflow = parseJSON(workflow.drawflow, {});
          }

          workflowStore
            .insert({
              ...workflow,
              createdAt: Date.now(),
            })
            .then((result) => {
              Object.values(result).forEach((item) => {
                const triggerBlock = findTriggerBlock(item.drawflow);
                registerWorkflowTrigger(item.id, triggerBlock);
              });

              resolve(result);
            });
        };

        files.forEach((file) => {
          const reader = new FileReader();

          reader.onload = handleOnLoadReader;
          reader.readAsText(file);
        });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

export function importFromRawJson(jsonData) {
  return new Promise((resolve, reject) => {
    try {
      const workflow =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const workflowStore = useWorkflowStore();

      if (workflow.includedWorkflows) {
        Object.keys(workflow.includedWorkflows).forEach((workflowId) => {
          const isWorkflowExists = Boolean(workflowStore.workflows[workflowId]);

          if (isWorkflowExists) return;

          const currentWorkflow = workflow.includedWorkflows[workflowId];
          currentWorkflow.table =
            currentWorkflow.table || currentWorkflow.dataColumns;
          delete currentWorkflow.dataColumns;

          workflowStore.insert(
            {
              ...currentWorkflow,
              id: workflowId,
              createdAt: Date.now(),
            },
            { duplicateId: true }
          );
        });

        delete workflow.includedWorkflows;
      }

      workflow.table = workflow.table || workflow.dataColumns;
      delete workflow.dataColumns;
      if (typeof workflow.drawflow === 'string') {
        workflow.drawflow = parseJSON(workflow.drawflow, {});
      }

      workflowStore
        .insert({
          ...workflow,
          createdAt: Date.now(),
        })
        .then((result) => {
          Object.values(result).forEach((item) => {
            const triggerBlock = findTriggerBlock(item.drawflow);
            registerWorkflowTrigger(item.id, triggerBlock);
          });

          resolve(result);
        })
        .catch((error) => {
          console.error('Error inserting workflow:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error importing workflow from raw JSON:', error);
      reject(error);
    }
  });
}

export function resetWorkflows(initialState) {
  const workflow =
    typeof jsonData === 'string' ? JSON.parse(initialState) : initialState;
  browser.storage.local.set({ workflows: workflow });
}

export function importFromRawJsonWithoutPinia(jsonData) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      // Parse JSON if it's a string
      const workflow =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Get current workflows from storage as array
      const { workflows = [] } = await browser.storage.local.get('workflows');
      const insertedWorkflows = {};
      // Get existing workflow IDs for duplication check
      const existingWorkflowIds = workflows.map((w) => w.id);

      // Handle included workflows
      if (workflow.includedWorkflows) {
        Object.keys(workflow.includedWorkflows).forEach((workflowId) => {
          // Skip if workflow with this ID already exists
          if (existingWorkflowIds.includes(workflowId)) return;

          const currentWorkflow = workflow.includedWorkflows[workflowId];

          // Data format conversion
          currentWorkflow.table =
            currentWorkflow.table || currentWorkflow.dataColumns;
          delete currentWorkflow.dataColumns;

          // Create default workflow data
          const defaultData = defaultWorkflow(
            {
              ...currentWorkflow,
              id: workflowId,
              createdAt: Date.now(),
            },
            { duplicateId: true }
          );

          // Add to workflows array
          workflows.push(defaultData);
          insertedWorkflows[workflowId] = defaultData;
          existingWorkflowIds.push(workflowId);
        });

        delete workflow.includedWorkflows;
      }

      // Process main workflow
      workflow.table = workflow.table || workflow.dataColumns;
      delete workflow.dataColumns;

      if (typeof workflow.drawflow === 'string') {
        workflow.drawflow = parseJSON(workflow.drawflow, {});
      }

      // Create default workflow
      const defaultData = defaultWorkflow({
        ...workflow,
        createdAt: Date.now(),
      });

      // Add to workflows array
      workflows.push(defaultData);
      insertedWorkflows[defaultData.id] = defaultData;
      // Save to storage
      await browser.storage.local.set({ workflows });

      // Handle trigger registration for each workflow
      Object.values(insertedWorkflows).forEach((item) => {
        const triggerBlock = findTriggerBlock(item.drawflow);
        if (triggerBlock) {
          registerWorkflowTrigger(item.id, triggerBlock);
        }
      });

      resolve(insertedWorkflows);
    } catch (error) {
      console.error('Import from raw JSON failed:', error);
      reject(error);
    }
  });
}

const defaultValue = {
  name: '',
  icon: '',
  table: [],
  settings: {},
  globalData: '',
  dataColumns: [],
  description: '',
  drawflow: { nodes: [], edges: [] },
  version: browser.runtime.getManifest().version,
};

export function convertWorkflow(workflow, additionalKeys = []) {
  if (!workflow) return null;

  const keys = [
    'name',
    'icon',
    'table',
    'version',
    'drawflow',
    'settings',
    'globalData',
    'description',
    ...additionalKeys,
  ];
  const content = {
    extVersion: browser.runtime.getManifest().version,
  };

  keys.forEach((key) => {
    content[key] = workflow[key] ?? defaultValue[key];
  });

  return content;
}
function findIncludedWorkflows(
  { drawflow },
  store,
  maxDepth = 3,
  workflows = {}
) {
  if (maxDepth === 0) return workflows;

  const flow = parseJSON(drawflow, drawflow);
  const blocks = flow?.drawflow?.Home.data ?? flow.nodes ?? null;
  if (!blocks) return workflows;

  const checkWorkflow = (type, workflowId) => {
    if (type !== 'execute-workflow' || workflows[workflowId]) return;

    const workflow = store.getById(workflowId);
    if (workflow) {
      workflows[workflowId] = convertWorkflow(workflow);
      findIncludedWorkflows(workflow, store, maxDepth - 1, workflows);
    }
  };

  if (flow.nodes) {
    flow.nodes.forEach((node) => {
      checkWorkflow(node.label, node.data.workflowId);
    });
  } else {
    Object.values(blocks).forEach(({ data, name }) => {
      checkWorkflow(name, data.workflowId);
    });
  }

  return workflows;
}
export function exportWorkflow(workflow) {
  if (workflow.isProtected) return;

  const workflowStore = useWorkflowStore();
  const includedWorkflows = findIncludedWorkflows(workflow, workflowStore);
  const content = convertWorkflow(workflow);

  content.includedWorkflows = includedWorkflows;

  const blob = new Blob([JSON.stringify(content)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  fileSaver(`${workflow.name}.automa.json`, url);
}

export default {
  export: exportWorkflow,
  import: importWorkflow,
};
