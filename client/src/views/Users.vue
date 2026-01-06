<template>
  <div>
    <b-container>
      <b-row>
        <b-col cols="12">
          <b-card>
            <h1 class="text-start text-md-center">COMMUNITY HOMEPAGE</h1>
            <h4 class="mb-3 text-start text-md-center">List of users:</h4>

            <b-list-group>
              <b-list-group-item
                v-for="user in users"
                :key="user._id"
                class="border-0"
              >
                <b-button
                  variant="outline-primary"
                  class="w-auto"
                  @click="$router.push({ name: 'userProfile', params: { id: user._id } })"
                >
                  {{ user.userName }}
                </b-button>
              </b-list-group-item>
            </b-list-group>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>

import { Api } from '@/Api'

export default {
  name: 'userProfile',
  data() {
    return {
      message: 'none',
      users: []
    }
  },
  methods: {
    getUsers() {
      Api.get('/users/')
        .then(response => {
          this.users = response.data.users
        })
        .catch(error => {
          this.message = error
        })
    }
  },
  // Methods run when entering this webpage
  created() {
    this.users = this.getUsers()
  }
}
</script>

<style>
  .users-info-style {
    text-align: left;
  }
</style>
