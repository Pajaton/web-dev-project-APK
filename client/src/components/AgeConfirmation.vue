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

/**
 * @component AgeConfirmation
 * @description Displays a modal to confirm user is of legal drinking age (20+).
 * Checks for existing user or guest sessions before showing the modal.
 */
export default {
  props: {
    /** @type {Object} The active session object */
    activeSession: Object,
    default: () => ({})
  },
  methods: {
    /**
     * @description Checks if a logged-in user or guest session exists.
     * Shows age confirmation modal if no valid session is found.
     */
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

    /**
     * @description Confirms the user's age and creates a guest session.
     * Hides the modal upon successful confirmation.
     */
    async confirmAge() {
      try {
        await Api.post('/guest-sessions')

        this.$refs['age-modal'].hide()
      } catch (error) {
        console.error('Error confirming age:', error)
      }
    },

    /**
     * @description Redirects user away from the site if they deny being of legal age.
     */
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
