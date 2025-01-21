<!-- src/App.vue -->
<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="scss">
// 重置默认样式
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: rgb(242, 242, 242);
  min-height: 100vh;
}
</style>