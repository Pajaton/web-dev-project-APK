<template>
  <!-- Login HTML template -->
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Welcome to APK</h1>
    </b-container>

    <BForm class="px-0 px-md-3">
      <BFormFloatingLabel
        label="Email address"
        label-for="floatingEmail"
        class="my-2"
      >
        <BFormInput
          id="floatingEmail"
          v-model="email"
          type="email"
          placeholder="Email address"
        />
      </BFormFloatingLabel>

      <BFormFloatingLabel
        label="Password"
        label-for="floatingPassword"
        class="my-2"
      >
        <BFormInput
          id="floatingPassword"
          v-model="password"
          type="password"
          placeholder="Password"
        />
      </BFormFloatingLabel>

      <div class="d-flex flex-column flex-md-row gap-2 align-items-start align-items-md-center justify-content-md-center">
        <b-button variant="danger" @click="resetFields()">Reset</b-button>
        <b-button variant="login" type="button" @click="userVerification()">Login</b-button>
        <b-button to="/register">Register</b-button>
      </div>
    </BForm>

    <BToast v-model="show" variant="info" solid>
      <template #title> Unable to login </template>
      Email or password is wrong.
    </BToast>
  </div>
</template>


<script>
// Login view behavior

import { Api } from '@/Api'

export default {
  name: 'login',
  data() {
    return {
      message: 'none',
      email: '',
      password: '',
      verifiedUser: false,
      show: false
    }
  },
  methods: {
    async userVerification() {
      try {
        const res = await Api.post('/sessions', {
          email: this.email,
          password: this.password
        })
        console.log('LOGIN SUCCESS:', res.data)
        this.$router.push({ path: '/home' })
      } catch (err) {
        this.show = true
      }
    },
    resetFields() {
      this.email = ''
      this.password = ''
      this.show = false
    }
  }
}
</script>

<style>
    /* Login CSS styles */
  .btn-login {
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
