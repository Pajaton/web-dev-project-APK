<template>
  <div id="age-confirmation-popup">
    <b-modal 
      ref="age-modal"
      title="Age Confirmation"
      @ok="confirmAge"
      ok-title="Yes, I am over 18"
      cancel-title="No"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
    >
      <p>Are you 20 years or older?</p>
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
        try {
          const response = await Api.get('/guest-sessions')

          if (!response.data.ageConfirmed) {
            this.$refs['age-modal'].show()
          }
        } catch (error) {
          console.error('Error checking session:', error)
        }
      },

      async confirmAge() {
        try {
          await Api.post('/guest-sessions')

          this.$refs['age-modal'].hide()
        } catch (error) {
          console.error('Error confirming age:', error)
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
