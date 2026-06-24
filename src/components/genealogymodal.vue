<template>
  <div class="p-5  w-full px-10">
    <h1 class="text-[clamp(1.2rem,2vw,2rem)] font-extrabold text-[#07407B] p-5">Developer Genealogy</h1>

    <div style="width: 100%; height: 600px;">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :fit-view-on-init="false"
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
          <div class="w-65 h-20 bg-white border-[3px] border-[#07407B] rounded flex flex-col items-center justify-center">
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
import { ref } from "vue"
import { VueFlow, Position, type Node, type Edge } from "@vue-flow/core"
import { Controls } from "@vue-flow/controls"
import { MiniMap } from "@vue-flow/minimap"
import { type Genealogy, genealogyData } from "@/assets/classes/genealogy"

const tree: Genealogy = genealogyData

const baseNodeWidth = 200
const baseNodeHeight = 64



let _counter = 0

function flatten(
  node: Genealogy,
  parentId: string | null,
  nodes: Node[],
  edges: Edge[]
): string {
  const id = String(++_counter)

  nodes.push({
    id,
    type: "genealogy",
    position: { x: 0, y: 0 }, 
    data: {
      fullName: `${node.first_name} ${node.last_name}`,
      position: node.position,
    },
  })

  if (parentId) {
    edges.push({
      id: `e${parentId}-${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
      style: {
        stroke: "#07407B",
        strokeWidth: 1,
       },
    })
  }

  for (const child of node.children ?? []) {
    flatten(child, id, nodes, edges)
  }

  return id
}

const rawNodes: Node[] = []
const rawEdges: Edge[] = []
flatten(tree, null, rawNodes, rawEdges)

// DAGRE LAYOUT

function layout(nodesIn: Node[], edgesIn: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 100 })

  nodesIn.forEach((n) => {
    g.setNode(n.id, { width: baseNodeWidth, height: baseNodeHeight })
  })

  edgesIn.forEach((e) => {
    g.setEdge(e.source, e.target)
  })

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

const nodes = ref<Node[]>(layout(rawNodes, rawEdges))
const edges = ref<Edge[]>(rawEdges)
</script>

<style scoped>

</style>