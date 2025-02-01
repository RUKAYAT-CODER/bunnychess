<template>
  <div class="grid place-items-center content-between w-full h-screen bg-blue-900">
    <div class="text-4xl md:text-6xl lg:text-7xl md:pt-10">BunnyChess</div>
    <slot name="top"></slot>
    <div class="sm:w-1/2 lg:w-1/3 rounded-xl">
      <slot></slot>
    </div>
    <div class="w-full flex-1 flex items-end justify-center space-x-6 pb-1 text-base text-center">
      <router-link to="privacy">Privacy policy</router-link>
      <router-link to="tos">Terms of service</router-link>
    </div>
  </div>
</template>
