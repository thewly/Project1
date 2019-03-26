var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectID = ''
var userLoggedIn = false

var testAPIMode = false

function updateTable(){
  console.log('testing update table')
  $('#myTrips').empty()
  $('#ourTrips').empty()
  database.ref().once('value', function(snap){
    if(userLoggedIn){
      $('#myTripsTable').removeClass('hidden-element')
      var username = snap.val().connections[connectID].user
      var userSearches = snap.val().users[username].searches
      console.log(userSearches)
      if(userSearches.length > 0){
        userSearches.forEach(function(search){
          $('#myTrips').append(`
            <tr>
            <th scope="col">${search.name}</th>
            <th scope="col">${search.endLoc}</th>
            <th scope="col">${search.leaveDate}</th>
            <th scope="col">Button</th>
            </tr>
            `)
          })
      }
    } else {
      $('#myTripsTable').addClass('hidden-element')
    }
    snap.val().searches.forEach(function(search){
      $('#ourTrips').append(`
        <tr>
        <th scope="col">${search.name}</th>
        <th scope="col">${search.endLoc}</th>
        <th scope="col">${search.leaveDate}</th>
        <th scope="col">Button</th>
        </tr>
        `)
    })
  })
}

$(document).on('click', '.switch-element-btn', function(){
  var hideElement = $(this).data('hide')
  var showElement = $(this).data('show')
  $(`#${hideElement}`).addClass('hidden-element')
  $(`#${showElement}`).removeClass('hidden-element')
})
$('#showSelectionPage').on('click', function(){
  updateTable()
})

$('#submit-btn').on('click', function(){
  var today = new Date()
  var month = today.getMonth() + 1
  var day = today.getDate()
  var year = today.getFullYear()
  var name = $('#nameInput').val()
  var startLocation = $('#originInput').val()
  var endLocation = $('#destinationInput').val()
  var departdate = $('#departDateInput').val()
  // 2019-04-01

  //Cole Unix code
  var rightNow = moment().valueOf()
  console.log("date of booking: " + rightNow);

  console.log($("#departureDate").val().trim())
  var date1 = new Date($("#departureDate").val()).getTime();
  console.log("departure: " + date1);

  var daysLeft = Math.floor((date1 - rightNow) / 86400000);
  console.log("days between when you started until now: " + daysLeft);

  if(testAPIMode){
    var queryURL = "https://apidojo-kayak-v1.p.rapidapi.com/flights/create-session?origin1=" + startLocation + "&destination1=" + endLocation + "&departdate1=" + departureDate + "&cabin=e&currency=USD&adults=1&bags=0";
    // var APIkey = "c9b53cf803msh302e1160032e5ffp16e9dbjsn3ccee16556b6";
    $("#output").append(`
      <div class="fa-3x">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    `)
    $.ajax({
      url: queryURL,
      headers: { "X-RapidAPI-Key": "c9b53cf803msh302e1160032e5ffp16e9dbjsn3ccee16556b6" },
      method: "GET"
    }).then(function (response) {
      console.log(response.cheapestPriceTotal);
      $("#output").text(response.cheapestPriceTotal);
    });
  }

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
        leaveDate: departdate,
      })
      database.ref(`/users/${username}/searches`).set(userSearchesArr)
    }
    searchesArr.push({
      name: name,
      plannedOn: `${month}/${day}/${year}`,
      startLoc: startLocation,
      endLoc: endLocation,
      leaveDate: departdate,
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
      updateTable()
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
