<template>
  <div class="p-5 w-full px-4 sm:px-10">
    <h1 class="text-[clamp(1.2rem,2vw,2rem)] font-extrabold text-[#07407B] dark:text-white p-5">Developer Genealogy</h1>

    <!-- Capped to the screen height so the tree never spills past a phone screen -->
    <div class="w-full h-[600px] max-h-[70vh]">
      <!-- LOADING -->
      <div v-if="loading" class="h-full flex items-center justify-center text-[#07407B]/60 dark:text-white/60">
        Loading hierarchy…
      </div>

      <!-- EMPTY -->
      <div v-else-if="nodes.length === 0" class="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-1">
        <p class="font-medium">No genealogy data yet.</p>
        <p class="text-sm">Add agents and assign their upline to build the tree.</p>
      </div>

      <!-- TREE -->
      <VueFlow
        v-else
        v-model:nodes="nodes"
        v-model:edges="edges"
        :fit-view-on-init="true"
        :nodes-draggable="false"
      >
        <MiniMap />
        <Controls
          position="top-right"
          :show-zoom="true"
          :show-fit-view="true"
          :show-interactive="false"
        />

        <template #node-genealogy="{ data }">
          <div class="w-65 h-20 bg-white dark:bg-black border-[3px] border-[#07407B] dark:border-maurealty-light-blue dark:text-maurealty-light-blue rounded flex flex-col items-center justify-center">
            <div class="text-5 font-medium">{{ data.fullName }}</div>
            <div class="text-3 font-light">{{ data.position }}</div>
          </div>
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import dagre from "@dagrejs/dagre"
import { ref, onMounted } from "vue"
import { VueFlow, Position, type Node, type Edge } from "@vue-flow/core"
import { Controls } from "@vue-flow/controls"
import { MiniMap } from "@vue-flow/minimap"
import { genealogyService, type GenealogyNode } from "@/services/genealogyService"
import { positionMap } from "@/assets/classes/agent"

import { useSettings } from "@/utils/useSettings"
const { configs } = useSettings();

const baseNodeWidth = 200
const baseNodeHeight = 64

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const loading = ref(true)

// Resolve a display label for a node's position: prefer the DB value, fall back
// to the static positionMap (the positions table is currently unpopulated).
function positionLabel(node: GenealogyNode): string {
  if (node.position) return node.position
  if (node.position_ID != null) return positionMap[node.position_ID] ?? "N/A"
  return "N/A"
}

// Flatten the tree into VueFlow nodes/edges. Uses agent_ID as the node id so
// edges are stable regardless of traversal order.
function flatten(node: GenealogyNode, parentId: string | null, outNodes: Node[], outEdges: Edge[]) {
  const id = String(node.agent_ID)

  outNodes.push({
    id,
    type: "genealogy",
    position: { x: 0, y: 0 },
    data: {
      fullName: `${node.first_name} ${node.last_name}`,
      position: positionLabel(node),
    },
  })

  if (parentId) {
    outEdges.push({
      id: `e${parentId}-${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
      style: { stroke: (configs.darkThemeEnabled) ? "#E3EEFA" : "#07407B", strokeWidth: 1 },
    })
  }

  for (const child of node.children) {
    flatten(child, id, outNodes, outEdges)
  }
}

// DAGRE LAYOUT — handles a forest (multiple roots) fine; disconnected roots are
// laid out side by side.
function layout(nodesIn: Node[], edgesIn: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 100 })

  nodesIn.forEach((n) => g.setNode(n.id, { width: baseNodeWidth, height: baseNodeHeight }))
  edgesIn.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodesIn.map((n) => {
    const { x, y } = g.node(n.id)
    return {
      ...n,
      position: { x: x - baseNodeWidth / 2, y: y - baseNodeHeight / 2 },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    }
  })
}

onMounted(async () => {
  try {
    const forest = await genealogyService.getTree()
    const rawNodes: Node[] = []
    const rawEdges: Edge[] = []
    for (const root of forest) flatten(root, null, rawNodes, rawEdges)

    nodes.value = rawNodes.length ? layout(rawNodes, rawEdges) : []
    edges.value = rawEdges
  } catch (e) {
    console.error("Failed to load genealogy tree:", e)
    nodes.value = []
    edges.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
</style>
