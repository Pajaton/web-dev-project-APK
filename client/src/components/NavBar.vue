<template>
    <div>
      <b-navbar toggleable="sm" type="dark" variant="info">
        <b-navbar-toggle target="nav-text-collapse">
           <b-button variant="navbar" block>APK Menu</b-button>
        </b-navbar-toggle>
          <b-container fluid>
            <b-row>
              <b-collapse id="nav-text-collapse" is-nav>
                <b-col><b-button block variant="navbar" to="/home">HOME</b-button></b-col>
                <b-col><b-button block variant="navbar" to="/drinks">Drinks</b-button></b-col>
                <b-col><b-button block variant="navbar" to="/systembolag">Systembolag</b-button></b-col>
                <b-col><b-button block variant="navbar" to="/users">Users</b-button></b-col>
                <b-col><b-button block variant="navbar" to="/reviews">Reviews</b-button></b-col>
                <b-col><b-button block variant="navbar" @click="loginLogout">{{ currentUserId ? 'Logout' : 'Login' }}</b-button></b-col>

              </b-collapse>
            </b-row>
          </b-container>
        </b-navbar>
    </div>
</template>

<script>

import { drinkApi } from '@/Api'

export default {
  name: 'navbar',
  data() {
    return {
      currentUserId: null
    }
  },
  mounted() {
    this.fetchCurrentUser()
  },
  // Re-fetch the current user when the route changes (navbar is not remounted)
  watch: {
    $route() {
      this.fetchCurrentUser()
    }
  },
  methods: {
    fetchCurrentUser() {
      drinkApi.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.currentUserId = response.data.user._id
        })
        .catch(error => {
          this.message = error
        })
    },
    async loginLogout() {
      if (!this.currentUserId) {
        this.$router.push('/login')
        return
      }

      try {
        await drinkApi.delete('/sessions/' + this.currentUserId)
      } catch (error) {
        this.message = error
      }

      this.currentUserId = null
      await this.fetchCurrentUser()
      this.$router.push('/login')
    }
  }
}
</script>

<style>
  .btn-navbar {
    color: rgb(246,214,70) !important;
    font-family: serif ,'Arial Narrow Bold', sans-serif !important;
    font-weight: bold !important;
    text-transform: uppercase;
    background: rgb(52,120,59)  !important;
    border-color: rgb(246,214,70) !important;
    border-width: 5px !important;
    border-style: solid;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.02);
  }
</style>
