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
                <b-col><b-button block variant="navbar" to="/login">Login</b-button></b-col>

              </b-collapse>
            </b-row>
          </b-container>
        </b-navbar>
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
