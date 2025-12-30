<template>
  <div id="age-confirmation-popup">
    <b-modal ref="age-modal">
      <p>Hello</p>
    </b-modal>
  </div>
</template>

<script>
  import { Api } from '@/Api.js'

  export default {
    props: {
      activeSession: Object,
      default: () => ({})
    },
    methods: {
      async checkIfSessionExists() {
        console.log("ojoj")
        const response = await Api.get('/guest-sessions')

        if (!response.data.isNewSession) {
          this.$refs['age-modal'].show()
        }
      }
    },
    mounted() {
      this.checkIfSessionExists()
    }
  }
</script>

<style>

</style>
