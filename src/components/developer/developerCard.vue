<template>
	<div class="bg-white p-6 rounded-[15px] shadow-lg w-full hover:shadow-[0_10px_15px_rgba(2,5,5.1,0.3)] transition-shadow">

		<!-- Profile -->
		<div class="flex items-center gap-4 mb-4 ">

			<img :src="dev.image_url || placeholder" class="w-16 h-16 rounded-full object-cover"/>
			<div>
				<h2 class="font-bold text-2xl">{{ dev.name }}</h2>
				<span class="bg-[#41BE0126] text-[#41BE01] text-xs font-semibold px-2 py-1 rounded">Active</span>
			</div>
		</div>

		<!-- Contact info -->
		<div class="mt-5 break-all text-[clamp(1rem,1vw,1.5rem)] flex flex-col px-1 gap-2 mb-4 text-gray-700">
			
			<div class="grid grid-cols-1 lg:grid-cols-2">
				<h1 class="font-semibold col-span-full">Contact Details</h1>
				<span class="flex items-center gap-2 text-lg"> <PhoneIcon class="size-5"/>{{ dev.phone }}</span>
				<span class="flex items-center gap-2 text-lg"> <MailIcon />{{ dev.email }}</span>
			</div>
		
			<div class="mt-4 flex items-center gap-2 text-xl break-normal text-wrap"> 
				<MapPinIcon /> {{ dev.location }}
			</div>

			<div class="mt-4 flex flex-col items-start">
				<h1 class="font-semibold">Available Office Hours</h1>
				<span class="text-lg p-2 pl-4 bg-gray-200 rounded-2xl w-full">
					<span v-if="dev.days" class="flex items-center gap-2"> <CalendarCheck2Icon class="size-4.5" /> {{ dev.days }} </span>
					<span v-if="dev.hours" class="flex items-center gap-2"> <ClockIcon class="size-4.5" /> {{ dev.hours }} </span>
					<span v-if="!dev.days && !dev.hours" class="flex items-center gap-2"> <CalendarOffIcon class="text-red-700 size-4.5" /> Office Hours not provided </span>
				</span>
			</div>
		</div>

		<!-- Recent Projects -->
		<div class="mb-4">
		<p class="font-semibold text-sm mb-1">Recent Projects</p>
		<div v-if="dev.projects && dev.projects.length" class="flex gap-2 flex-wrap">
			<button
				v-for="project in dev.projects"
				:key="project.listing_ID"
				@click="$emit('open-listing', project)"
				class="bg-gray-200 hover:bg-maurealty-blue hover:text-white text-gray-800 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
				:title="project.listing_title"
			>
				{{ project.listing_title }}
			</button>
		</div>
		<p v-else class="text-xs text-gray-400 italic">No recent projects yet</p>
		</div>

		<!-- buttons -->
		<div class="flex gap-2 items-end justify-end">
			<button class="text-[clamp(0.75rem,2vw,1rem)] md:h-9 md:w-27 h-max-[36px] w-max-[108px]  border border-red-600 text-red-600 rounded-[5px] px-4 py-2 hover:bg-red-100 flex items-center gap-2 justify-center" >
				Delete
			</button>
			<button class="text-[clamp(0.75rem,2vw,1rem)] md:h-9 md:w-27 h-max-[36px] w-max-[108px]  border border-[#B4AFAF] rounded-[5px] px-4 py-2 hover:bg-gray-100 flex items-center gap-2 justify-center" >
				Edit
			</button>
			<button class="text-[clamp(0.75rem,2vw,1rem)] w-max-[121px] md:h-9 md:w-30.25 bg-maurealty-blue text-white rounded-[5px] px-4 py-2 hover:bg-[#045fa3] flex items-center gap-2 justify-center">
				Contact
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { type Developer, type DeveloperProject } from '@/assets/classes/developers';
import placeholder from '@/assets/images/default_placeholder.png'
import { PhoneIcon, MailIcon, MapPinIcon, CalendarCheck2Icon, CalendarOffIcon, ClockIcon } from 'lucide-vue-next';

const props = defineProps<{ dev: Developer }>()
defineEmits<{ (e: 'open-listing', project: DeveloperProject): void }>()

console.log("Dev_ID: " + props.dev.dev_ID + "\nImg_Url: " + props.dev.image_url + "\nName: " + props.dev.name + "\nPhone: " + props.dev.phone + "\nEmail: " + props.dev.email + "\nLocation: " + props.dev.location + "\nHours: " + props.dev.hours);
</script>