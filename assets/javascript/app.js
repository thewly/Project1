var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var currentPage = 'landing-page'

$(document).on('click', '.switch-page-btn', function(){
  console.log('btn clicked')
  var newPage = $(this).data('page')
  console.log('before: ' + currentPage)
  $(`#${currentPage}-container`).css('display', 'none')
  $(`#${newPage}-container`).css('display', 'block')
  currentPage = newPage
  console.log('after: ' + currentPage)
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
    var userLogin = user.email.substring(0, user.email.indexOf('@'))
    var userEmail = user.email
    console.log(userLogin)
    database.ref().once('value', function(snap){
      console.log(snap.val())
    })
    database.ref('/users').update({
      [userLogin]: {
        email: userEmail,
        username: userLogin,
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
