<template>
    <div>
      <b-button-group variant="navbar">
        <b-dropdown variant="navbar" text="APK Menu">
          <b-dropdown-item variant="navbar" to="/home">HOME</b-dropdown-item>
          <b-dropdown-item variant="navbar" to="/drinks">Drinks</b-dropdown-item>
          <b-dropdown-item variant="navbar" to="/systembolag">Systembolag</b-dropdown-item>
          <b-dropdown-item variant="navbar" to="/users">Users</b-dropdown-item>
          <b-dropdown-item variant="navbar" to="/reviews">Reviews</b-dropdown-item>
        </b-dropdown>
        <b-button variant="navbar" to="/home">HOME</b-button>
        <b-button variant="navbar" to="/drinks">Drinks</b-button>
        <b-button variant="navbar" to="/systembolag">Systembolag</b-button>
        <b-button variant="navbar" to="/users">Users</b-button>
        <b-button variant="navbar" to="/reviews">Reviews</b-button>
      </b-button-group>
    </div>
</template>

<script>
export default {
  name: 'navbar'
}
</script>

<style>
  .btn-navbar {
    color: green !important;
    font-family: Impact,'Arial Narrow Bold', sans-serif !important;
    background: yellow !important;
    border-color: green !important;
    border-width: 5px !important;
    border-style: solid;
  }
</style>
