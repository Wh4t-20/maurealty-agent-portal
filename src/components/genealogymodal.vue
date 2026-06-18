<template>
    <div class="p-5">
      <h1>Developer Genealogy</h1>
  
      <svg :width="svgWidth" :height="svgHeight">
  
        <!-- Edges -->
        <path
          v-for="edge in layoutEdges"
          :key="edge.id"
          :d="edge.path"
          fill="none"
          stroke="#6366f1"
          stroke-width="2"
          stroke-opacity="0.6"
        />
  
        <!-- Nodes -->
        <g
          v-for="node in layoutNodes"
          :key="node.id"
          :transform="`translate(${node.x - getNodeWidth() / 2}, ${node.y - getNodeHeight() / 2})`"
        >
          <rect
            :width="getNodeWidth()"
            :height="getNodeHeight()"
            fill="white"
            stroke="black"
            rx = "4"
          />
  
          <text
            :x="getNodeWidth() / 2"
            :y="getNodeHeight() / 2 - 6"
            text-anchor="middle"
            font-size="12"
            
          >
            {{ node.fullName }}
          </text>
  
          <text
            :x="getNodeWidth() / 2"
            :y="getNodeHeight() / 2 + 12"
            text-anchor="middle"
            font-size="10"
          >
            {{ node.position }}
          </text>
        </g>
  
      </svg>
    </div>
  </template>
  
  <script setup lang="ts">
  import dagre from "dagre"
  import { computed } from "vue"
  import { type Genealogy, genealogyData } from "@/assets/classes/genealogy"
  
  const tree: Genealogy = genealogyData
  
  const baseNodeWidth = 200
  const baseNodeHeight = 64
  const maxNodes = 10
  
  const rankSep = 80
  const nodeSep = 40
  const padding = 80
  
  interface FlatNode {
    id: string
    fullName: string
    position: string
  }
  
  interface FlatEdge {
    from: string
    to: string
  }
  
  let _counter = 0
  
  function flatten(
    node: Genealogy,
    parentId: string | null,
    nodes: FlatNode[],
    edges: FlatEdge[]
  ): string {
    const id = String(++_counter)
  
    nodes.push({
      id,
      fullName: `${node.first_name}  ${node.last_name}`,
      position: node.position,
    })
  
    if (parentId) edges.push({ from: parentId, to: id })
  
    for (const child of node.children ?? []) {
      flatten(child, id, nodes, edges)
    }
  
    return id
  }
  
  const flatNodes: FlatNode[] = []
  const flatEdges: FlatEdge[] = []
  flatten(tree, null, flatNodes, flatEdges)
  
 
  _counter = 0

  // DYNAMIC NODE SIZE
  
  function getScale() {
    const count = flatNodes.length
    if (count <= maxNodes) return 1
    return Math.max(0.5, maxNodes / count)
  }
  
  function getNodeWidth() {
    return baseNodeWidth * getScale()
  }
  
  function getNodeHeight() {
    return baseNodeHeight * getScale()
  }
  
  
  // DAGRE GRAPH
  
  function buildGraph() {
    const g = new dagre.graphlib.Graph()
  
    g.setGraph({
      rankdir: "TB",
      ranksep: rankSep,
      nodesep: nodeSep,
    })
  
    g.setDefaultEdgeLabel(() => ({}))
  
    flatNodes.forEach((n) => {
      g.setNode(n.id, {
        width: getNodeWidth(),
        height: getNodeHeight(),
      })
    })
  
    flatEdges.forEach((e) => g.setEdge(e.from, e.to))
  
    dagre.layout(g)
  
    return g
  }

  // LAYOUT NODES
  
  const layoutNodes = computed(() => {
    const g = buildGraph()
  
    return flatNodes.map((n) => {
      const { x, y } = g.node(n.id)
      return { ...n, x, y }
    })
  })
  

  // LAYOUT EDGES
  
  const layoutEdges = computed(() => {
    const g = buildGraph()
  
    return flatEdges.map((e, i) => {
      const src = g.node(e.from)
      const tgt = g.node(e.to)
  
      const x1 = src.x
      const y1 = src.y + getNodeHeight() / 2
      const x2 = tgt.x
      const y2 = tgt.y - getNodeHeight() / 2
      const cy = (y1 + y2) / 2
  
      return {
        id: i,
        path: `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`,
      }
    })
  })
  
 
  // SVG SIZE 
  const svgWidth = computed(() => {
    if (!layoutNodes.value.length) return 800
    const maxX = Math.max(...layoutNodes.value.map((n) => n.x))
    return maxX + padding
  })
  
  const svgHeight = computed(() => {
    if (!layoutNodes.value.length) return 600
    const maxY = Math.max(...layoutNodes.value.map((n) => n.y))
    return maxY + padding
  })
  </script>
  
  <style scoped>

  </style>