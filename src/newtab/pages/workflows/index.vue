<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold capitalize">
      {{ t('common.workflow', 2) }}
    </h1>
    <div class="flex items-start mt-8">
      <div class="sticky hidden top-8 w-60 lg:block">
        <div class="flex w-full">
          <ui-button
            :title="shortcut['action:new'].readable"
            variant="accent"
            class="flex-1 font-semibold border-r rounded-r-none"
            @click="addWorkflowModal.show = true"
          >
            {{ t('workflow.new') }}
          </ui-button>
          <ui-popover>
            <template #trigger>
              <ui-button icon class="rounded-l-none" variant="accent">
                <v-remixicon name="riArrowLeftSLine" rotate="-90" />
              </ui-button>
            </template>
            <ui-list class="space-y-1">
              <ui-list-item
                v-close-popover
                class="cursor-pointer"
                @click="openImportDialog"
              >
                {{ t('workflow.import') }}
              </ui-list-item>
              <ui-list-item
                v-close-popover
                class="cursor-pointer"
                @click="initRecordWorkflow"
              >
                {{ t('home.record.title') }}
              </ui-list-item>
              <ui-list-item
                v-close-popover
                class="cursor-pointer"
                @click="handleImportRawWorkflow"
              >
                Import raw Json
              </ui-list-item>
              <ui-list-item
                v-close-popover
                class="cursor-pointer"
                @click="addHostedWorkflow"
              >
                {{ t('workflow.host.add') }}
              </ui-list-item>
            </ui-list>
          </ui-popover>
        </div>
        <ui-list class="mt-6 space-y-2">
          <ui-list-item
            tag="a"
            href="https://www.automa.site/workflows"
            target="_blank"
          >
            <v-remixicon name="riCompass3Line" />
            <span class="ml-4 capitalize">
              {{ t('workflow.browse') }}
            </span>
          </ui-list-item>
          <ui-expand
            v-if="state.teams.length > 0"
            append-icon
            header-class="flex items-center w-full px-4 py-2 mb-1 rounded-lg hoverable"
          >
            <template #header>
              <v-remixicon name="riTeamLine" />
              <span class="flex-1 ml-4 text-left capitalize">
                Team Workflows
              </span>
            </template>
            <ui-list class="space-y-1">
              <ui-list-item
                v-for="team in state.teams"
                :key="team.id"
                :active="state.teamId === team.id || +state.teamId === team.id"
                :title="team.name"
                color="bg-box-transparent font-semibold"
                class="cursor-pointer pl-14"
                @click="updateActiveTab({ activeTab: 'team', teamId: team.id })"
              >
                <span class="text-overflow">
                  {{ team.name }}
                </span>
              </ui-list-item>
            </ui-list>
          </ui-expand>
          <ui-expand
            :model-value="true"
            append-icon
            header-class="flex items-center w-full px-4 py-2 rounded-lg hoverable"
          >
            <template #header>
              <v-remixicon name="riFlowChart" />
              <span class="flex-1 ml-4 text-left capitalize">
                {{ t('workflow.my') }}
              </span>
            </template>
            <ui-list class="mt-1 space-y-1">
              <ui-list-item
                tag="button"
                :active="state.activeTab === 'local'"
                color="bg-box-transparent font-semibold"
                class="pl-14"
                @click="updateActiveTab({ activeTab: 'local' })"
              >
                <span class="capitalize">
                  {{ t('workflow.type.local') }}
                </span>
              </ui-list-item>
              <ui-list-item
                v-if="userStore.user"
                :active="state.activeTab === 'shared'"
                tag="button"
                color="bg-box-transparent font-semibold"
                class="pl-14"
                @click="updateActiveTab({ activeTab: 'shared' })"
              >
                <span class="capitalize">
                  {{ t('workflow.type.shared') }}
                </span>
              </ui-list-item>
              <ui-list-item
                v-if="hostedWorkflows?.length > 0"
                :active="state.activeTab === 'host'"
                color="bg-box-transparent font-semibold"
                tag="button"
                class="pl-14"
                @click="updateActiveTab({ activeTab: 'host' })"
              >
                <span class="capitalize">
                  {{ t('workflow.type.host') }}
                </span>
              </ui-list-item>
            </ui-list>
          </ui-expand>
        </ui-list>
        <workflows-folder
          v-if="state.activeTab === 'local'"
          v-model="state.activeFolder"
        />
      </div>
      <div
        class="flex-1 workflows-list lg:ml-8"
        style="min-height: calc(100vh - 8rem)"
        @dblclick="clearSelectedWorkflows"
      >
        <div class="flex flex-wrap items-center">
          <div class="flex items-center w-full md:w-auto">
            <ui-input
              id="search-input"
              v-model="state.query"
              class="flex-1 md:w-auto"
              :placeholder="`${t(`common.search`)}... (${
                shortcut['action:search'].readable
              })`"
              prepend-icon="riSearch2Line"
            />
            <ui-popover>
              <template #trigger>
                <ui-button variant="accent" class="ml-4 lg:hidden">
                  <v-remixicon name="riAddLine" class="mr-2 -ml-1" />
                  <span>{{ t('common.workflow') }}</span>
                </ui-button>
              </template>
              <ui-list class="space-y-1">
                <ui-list-item
                  v-close-popover
                  class="cursor-pointer"
                  @click="addWorkflowModal.show = true"
                >
                  {{ t('workflow.new') }}
                </ui-list-item>
                <ui-list-item
                  v-close-popover
                  class="cursor-pointer"
                  @click="openImportDialog"
                >
                  {{ t('workflow.import') }}
                </ui-list-item>
                <ui-list-item
                  v-close-popover
                  class="cursor-pointer"
                  @click="initRecordWorkflow"
                >
                  {{ t('home.record.title') }}
                </ui-list-item>
                <ui-list-item
                  v-close-popover
                  class="cursor-pointer"
                  @click="addHostedWorkflow"
                >
                  {{ t('workflow.host.add') }}
                </ui-list-item>
              </ui-list>
            </ui-popover>
          </div>
          <div class="grow"></div>
          <div class="flex items-center w-full mt-4 md:mt-0 md:w-auto">
            <ui-button class="inline-block mr-4" @click="handleSaveAllLocal">
              Save all to local
            </ui-button>
            <span
              v-tooltip:bottom.group="t('workflow.backupCloud')"
              class="mr-4"
            >
              <ui-button
                tag="router-link"
                to="/backup"
                class="inline-block"
                icon
              >
                <v-remixicon name="riUploadCloud2Line" />
              </ui-button>
            </span>
            <div class="flex items-center flex-1 workflow-sort">
              <ui-button
                icon
                class="border-r border-gray-300 rounded-r-none dark:border-gray-700"
                @click="
                  state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
                "
              >
                <v-remixicon
                  :name="state.sortOrder === 'asc' ? 'riSortAsc' : 'riSortDesc'"
                />
              </ui-button>
              <ui-select
                v-model="state.sortBy"
                :placeholder="t('sort.sortBy')"
                class="flex-1"
              >
                <option v-for="sort in sorts" :key="sort" :value="sort">
                  {{ t(`sort.${sort}`) }}
                </option>
              </ui-select>
            </div>
            <ui-select
              v-model="state.activeTab"
              class="ml-4 lg:hidden"
              :placeholder="t('common.workflow', 2)"
            >
              <option value="local">
                {{ t('workflow.type.local') }}
              </option>
              <option v-if="userStore.user" value="shared">
                {{ t('workflow.type.shared') }}
              </option>
              <option v-if="hostedWorkflows?.length > 0" value="host">
                {{ t('workflow.type.host') }}
              </option>
            </ui-select>
          </div>
        </div>
        <ui-tab-panels v-model="state.activeTab" class="flex-1 mt-6">
          <ui-tab-panel value="team" cache>
            <workflows-user-team
              :active="state.activeTab === 'team'"
              :team-id="state.teamId"
              :search="state.query"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
          <ui-tab-panel value="shared" class="workflows-container">
            <workflows-shared
              :search="state.query"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
          <ui-tab-panel value="host" class="workflows-container">
            <workflows-hosted
              :search="state.query"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
          <ui-tab-panel value="local">
            <workflows-local
              v-model:per-page="state.perPage"
              :search="state.query"
              :folder-id="state.activeFolder"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
        </ui-tab-panels>
        <ui-card
          v-if="workflowStore.isFirstTime"
          class="relative mt-8 first-card dark:text-gray-200"
        >
          <v-remixicon
            name="riCloseLine"
            class="absolute cursor-pointer top-4 right-4"
            @click="workflowStore.isFirstTime = false"
          />
          <p>Create your first workflow by recording your actions:</p>
          <ol class="list-decimal list-inside">
            <li>Open your browser and go to your destination URL</li>
            <li>
              Click the "Record workflow" button, and do your simple repetitive
              task
            </li>
            <li>
              Need more help? Join
              <a
                href="https://discord.gg/C6khwwTE84"
                target="_blank"
                rel="noreferer"
                >the community</a
              >, or email us at
              <a href="mailto:support@automa.site" target="_blank"
                >support@automa.site</a
              >
            </li>
          </ol>
          <p class="mt-4">
            Learn more about recording in
            <a
              href="https://docs.automa.site/guide/quick-start.html#recording-actions"
              target="_blank"
              >the documentation</a
            >
          </p>
        </ui-card>
      </div>
    </div>
    <ui-modal v-model="addWorkflowModal.show" title="Workflow">
      <ui-input
        v-model="addWorkflowModal.name"
        :placeholder="t('common.name')"
        autofocus
        class="w-full mb-4"
        @keyup.enter="
          addWorkflowModal.type === 'manual'
            ? addWorkflow()
            : startRecordWorkflow()
        "
      />
      <ui-textarea
        v-model="addWorkflowModal.description"
        :placeholder="t('common.description')"
        height="165px"
        class="w-full dark:text-gray-200"
        max="300"
      />
      <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
        {{ addWorkflowModal.description.length }}/300
      </p>
      <div class="flex space-x-2">
        <ui-button class="w-full" @click="clearAddWorkflowModal">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button
          variant="accent"
          class="w-full"
          @click="
            addWorkflowModal.type === 'manual'
              ? addWorkflow()
              : startRecordWorkflow()
          "
        >
          {{
            addWorkflowModal.type === 'manual'
              ? t('common.add')
              : t('home.record.button')
          }}
        </ui-button>
      </div>
    </ui-modal>
    <shared-permissions-modal
      v-model="permissionState.showModal"
      :permissions="permissionState.items"
    />
  </div>
</template>
<script setup>
import { computed, shallowReactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import { isWhitespace, findTriggerBlock } from '@/utils/helper';
import {
  importWorkflow,
  getWorkflowPermissions,
  importFromRawJson,
} from '@/utils/workflowData';
import recordWorkflow from '@/newtab/utils/startRecordWorkflow';
import WorkflowsLocal from '@/components/newtab/workflows/WorkflowsLocal.vue';
import WorkflowsShared from '@/components/newtab/workflows/WorkflowsShared.vue';
import WorkflowsHosted from '@/components/newtab/workflows/WorkflowsHosted.vue';
import WorkflowsFolder from '@/components/newtab/workflows/WorkflowsFolder.vue';
import WorkflowsUserTeam from '@/components/newtab/workflows/WorkflowsUserTeam.vue';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal.vue';
import { exportData } from '@/utils/backup';

useGroupTooltip();

const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();
const router = useRouter();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

const sorts = ['name', 'createdAt', 'updatedAt', 'mostUsed'];
const { teamId, active } = router.currentRoute.value.query;
const savedSorts = JSON.parse(localStorage.getItem('workflow-sorts') || '{}');
const validTeamId = userStore.user?.teams?.some(
  ({ id }) => id === teamId || id === +teamId
);

const state = shallowReactive({
  teams: [],
  query: '',
  activeFolder: '',
  activeTab: active || 'local',
  teamId: validTeamId ? teamId : '',
  perPage: savedSorts.perPage || 18,
  sortBy: savedSorts.sortBy || 'createdAt',
  sortOrder: savedSorts.sortOrder || 'desc',
});
const addWorkflowModal = shallowReactive({
  name: '',
  show: false,
  type: 'manual',
  description: '',
});
const permissionState = shallowReactive({
  items: [],
  showModal: false,
});

const hostedWorkflows = computed(() => hostedWorkflowStore.toArray);

function clearAddWorkflowModal() {
  Object.assign(addWorkflowModal, {
    name: '',
    show: false,
    type: 'manual',
    description: '',
  });
}
function initRecordWorkflow() {
  addWorkflowModal.show = true;
  addWorkflowModal.type = 'recording';
}

function startRecordWorkflow() {
  recordWorkflow({
    name: addWorkflowModal.name,
    description: addWorkflowModal.description,
  }).then(() => {
    router.push('/recording');
  });
}
function updateActiveTab(data = {}) {
  if (data.activeTab !== 'team') data.teamId = '';

  Object.assign(state, data);
}
function addWorkflow() {
  workflowStore
    .insert({
      name: addWorkflowModal.name,
      folderId: state.activeFolder,
      description: addWorkflowModal.description,
    })
    .then((workflows) => {
      const workflowId = Object.keys(workflows)[0];
      router.push(`/workflows/${workflowId}`);
    })
    .finally(clearAddWorkflowModal);
}
async function checkWorkflowPermissions(workflows) {
  let requiredPermissions = [];

  for (const workflow of workflows) {
    if (workflow.drawflow) {
      const permissions = await getWorkflowPermissions(workflow.drawflow);
      requiredPermissions.push(...permissions);
    }
  }

  requiredPermissions = Array.from(new Set(requiredPermissions));
  if (requiredPermissions.length === 0) return;

  permissionState.items = requiredPermissions;
  permissionState.showModal = true;
}
function addHostedWorkflow() {
  dialog.prompt({
    async: true,
    inputType: 'url',
    okText: t('common.add'),
    title: t('workflow.host.add'),
    label: t('workflow.host.id'),
    placeholder: 'abcd123',
    onConfirm: async (value) => {
      if (isWhitespace(value)) return false;
      const hostId = value.replace(/\s/g, '');

      try {
        if (!userStore.user && hostedWorkflowStore.toArray.length >= 3)
          throw new Error('rate-exceeded');

        const isTheUserHost = userStore.getHostedWorkflows.some(
          (host) => hostId === host.hostId
        );
        if (isTheUserHost) throw new Error('exist');

        const response = await fetchApi('/workflows/hosted', {
          auth: true,
          method: 'POST',
          body: JSON.stringify({ hostId }),
        });
        const result = await response.json();

        if (!response.ok) {
          const error = new Error(result.message);
          error.data = result.data;

          throw error;
        }

        if (result === null) throw new Error('not-found');

        result.hostId = `${hostId}`;
        result.createdAt = Date.now();

        await checkWorkflowPermissions([result]);
        await hostedWorkflowStore.insert(result, hostId);

        const triggerBlock = findTriggerBlock(result.drawflow);
        await registerWorkflowTrigger(hostId, triggerBlock);

        return true;
      } catch (error) {
        console.error(error);
        const messages = {
          exists: t('workflow.host.messages.hostExist'),
          'rate-exceeded': t('message.rateExceeded'),
          'not-found': t('workflow.host.messages.notFound', { id: hostId }),
        };
        const errorMessage = messages[error.message] || error.message;

        toast.error(errorMessage);

        return false;
      }
    },
  });
}
async function openImportDialog() {
  try {
    const workflows = await importWorkflow({ multiple: true });
    await checkWorkflowPermissions(Object.values(workflows));
  } catch (error) {
    console.error(error);
  }
}
function handleImportRawWorkflow() {
  dialog.prompt({
    async: true,
    inputType: 'textarea',
    okText: t('common.add'),
    title: 'Import raw Json',
    label: 'Json',
    placeholder: 'Paste your Json here',
    onConfirm: async (value) => {
      if (isWhitespace(value)) return false;
      try {
        const workflows = await importFromRawJson(value);
        await checkWorkflowPermissions(Object.values(workflows));
        return true;
      } catch (error) {
        console.error(error);
        toast.error('Invalid Json');
        return false;
      }
    },
  });
}

const shortcut = useShortcut(['action:search', 'action:new'], ({ id }) => {
  if (id === 'action:search') {
    const searchInput = document.querySelector('#search-input input');
    searchInput?.focus();
  } else {
    addWorkflowModal.show = true;
  }
});

watch(
  () => [state.sortOrder, state.sortBy, state.perPage],
  ([sortOrder, sortBy, perPage]) => {
    localStorage.setItem(
      'workflow-sorts',
      JSON.stringify({ sortOrder, sortBy, perPage })
    );
  }
);
watch(
  () => [state.activeTab, state.teamId],
  ([activeTab, teamIdQuery]) => {
    const query = { active: activeTab };

    if (teamIdQuery) query.teamId = teamIdQuery;

    router.replace({ ...router.currentRoute.value, query });
  }
);

onMounted(() => {
  const teams = [];
  let unknownInputted = false;
  Object.keys(teamWorkflowStore.workflows).forEach((id) => {
    const userTeam = userStore.user?.teams?.find(
      (team) => team.id === id || team.id === +id
    );

    if (userTeam) {
      teams.push({ name: userTeam.name, id: userTeam.id });
    } else if (!unknownInputted && teamWorkflowStore.getByTeam(id).length > 0) {
      unknownInputted = true;
      teams.unshift({ name: '(unknown)', id: '(unknown)' });
    }
  });

  state.teams = teams;
});
async function handleSaveAllLocal() {
  const data = await exportData();
  fetch('http://localhost:1289/api/backup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
    .then(() => {
      toast.success('The data has been saved to local');
    })
    .catch((err) => {
      toast.error('Failed to save data to local');
      console.error(err);
    });
}
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
.workflows-container {
  @apply grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4;
}

.first-card {
  a {
    @apply text-blue-400 underline;
  }
}
</style>
