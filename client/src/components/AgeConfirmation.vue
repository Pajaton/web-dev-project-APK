<template>
  <div id="age-confirmation-popup">
    <b-modal
      ref="age-modal"
      title="Age Confirmation"
      @ok="confirmAge"
      ok-title="Yes, I am over 18"
      @cancel="denyAccess"
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
        // first check for logged in user
        const sessionResponse = await Api.get('/sessions/currentlyLoggedin/')

        if (!sessionResponse.data.user) {
          this.$refs['age-modal'].show()
        }
      } catch {
        try {
          // if no logged in user, check for guest session
          const guestResponse = await Api.get('/guest-sessions')

          if (!guestResponse.data.ageConfirmed) {
            this.$refs['age-modal'].show()
          }
        } catch (error) {
          console.error('Error checking session:', error)
        }
      }
    },

    async confirmAge() {
      try {
        await Api.post('/guest-sessions')

        this.$refs['age-modal'].hide()
      } catch (error) {
        console.error('Error confirming age:', error)
      }
    },

    denyAccess() {
      window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  },
  mounted() {
    this.checkIfSessionExists()
  }
}
</script>

<style>

</style>
