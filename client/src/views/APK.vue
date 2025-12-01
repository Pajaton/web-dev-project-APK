<template>
    <!-- APK HTML template -->
    <div>
        <p>APK</p>
        <button @click="getMessage">Load drinks</button>
        <pre>{{ message }}</pre>
    </div>
</template>

<script>

import { drinkApi } from '@/Api'

    // APK view behavior
export default {
    name: 'APK',
    data() {
    return {
      message: 'none'
    }
  },
  methods: {
    getMessage() {
      drinkApi.get('/drinks')
        .then(response => {
          this.message = JSON.stringify(response.data, null, 2)
        })
        .catch(error => {
          this.message = error
        })
    }
  }
}
</script>

<style>
    /* APK CSS styles */
</style>