var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectID = ''
var userLoggedIn = false

function updateTable(){
  database.ref().once('value', function(snap){
    if(userLoggedIn){
      var username = snap.val().connections[connectID].user
      var userSearches = snap.val().users[username].searches
      console.log(userSearches)
      $('#myTrips').append()
    }
    $('#ourTrips').append()
  })
}

$(document).on('click', '.switch-element-btn', function(){
  var hideElement = $(this).data('hide')
  var showElement = $(this).data('show')
  $(`#${hideElement}`).addClass('hidden-element')
  $(`#${showElement}`).removeClass('hidden-element')
})

$('#submit-btn').on('click', function(){
  var date = new Date()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var year = date.getFullYear()
  var name = $('#nameInput').val()
  var startLocation = $('#originInput').val()
  var endLocation = $('#destinationInput').val()
  var date = $('#departDateInput').val()

  database.ref().once('value', function(snap){
    var username = snap.val().connections[connectID].user
    var searchesArr = snap.val().searches.filter(Boolean)
    if(userLoggedIn){
      var userSearchesArr = snap.val().users[username].searches.filter(Boolean)
      userSearchesArr.push({
        name: name,
        plannedOn: `${month}/${day}/${year}`,
        startLoc: startLocation,
        endLoc: endLocation,
        leaveDate: date,
      })
      database.ref(`/users/${username}/searches`).set(userSearchesArr)
    }
    searchesArr.push({
      name: name,
      plannedOn: `${month}/${day}/${year}`,
      startLoc: startLocation,
      endLoc: endLocation,
      date: date,
    })
    database.ref('/searches').set(searchesArr)
  })

  updateTable()
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
      }
      database.ref('/connections').update({
        [connectID]: {
          user: username,
        }
      })
      userLoggedIn = true;
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
