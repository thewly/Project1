var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectID = ''

$(document).on('click', '.switch-element-btn', function(){
  var hideElement = $(this).data('hide')
  var showElement = $(this).data('show')
  $(`#${hideElement}-container`).addClass('hidden-element')
  $(`#${showElement}-container`).removeClass('hidden-element')
})
<button class='switch-page-btn' data-hide='current-page' data-show='landing-page' type="button" name="button">Return Home</button>

$('#submit-search').on('click', function(){
  var name = $('#input-name').val()
  var startLocation = $('#input-startLocation').val()
  var endLocation = $('#input-endLocation').val()
  var date = $('#input-date').val()


})

// Testing Google Auth
$('#google-login-btn').on('click', function(){
  event.preventDefault()
  console.log('testing')
  firebase.auth().signInWithPopup(provider).then(function(result) {
    console.log('inside auth')
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    var username = user.email.substring(0, user.email.indexOf('@'))
    var userEmail = user.email
    console.log(username)
    $('#login-info').html(`<p>${username}</p>`)
    database.ref('/users').once('value', function(snap){
      console.log('testing')
      console.log(snap.val()[username])
      if(!snap.val()[username]){
        database.ref('/users').update({
          [username]: {
            id: connectID,
            email: userEmail,
            username: username,
            searches: '',
          }
        })
      } else {
        connectID = snap.val()[username].id
      }
    })

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
  });
})

database.ref('.info/connected').on('value', (snap)=>{
  if(snap.val()){
    var con = database.ref('/connections').push(true)
    connectID = con.key

    con.onDisconnect().remove()
  }
})
