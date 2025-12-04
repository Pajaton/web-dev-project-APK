<template>
  <!-- Login HTML template -->
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Welcome to APK</h1>
    </b-container>
    <BForm>
      <BFormFloatingLabel
        label="Email address"
        label-for="floatingEmail"
        class="my-2"
      >
        <BFormInput
          id="floatingEmail"
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
          type="password"
          placeholder="Password"
        />
      </BFormFloatingLabel>
    </BForm>
    <b-button block variant="login">Login</b-button>
    <b-button block  to="/register">Register</b-button>
  </div>
</template>

<script>
// Login view behavior
export default {
  name: 'login',
  data() {
    return {
      message: 'none'
    }
  }
}

</script>

<style>
    /* Login CSS styles */
  .btn-login {
    color: green !important;
    font-family: Impact,'Arial Narrow Bold', sans-serif !important;
    background: yellow !important;
    border-color: green !important;
    border-width: 5px !important;
    border-style: solid;
  }
</style>
