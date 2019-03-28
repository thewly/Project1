var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectID = ''
var userLoggedIn = false

var testAPIMode = true;
var cheapestPriceTotal = 100;

// added blank variables to limit errors since these hadn't been defined yet since previously they were only defined in a click function
var name = "";
var endLocation = "";
var departdate = "";


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
  name = $('#nameInput').val()
  var startLocation = $('#originInput').val()
  endLocation = $('#destinationInput').val()
  departdate = $('#departDateInput').val()
  
  // Is this next line useless? I can't see where it goes?
  // var traveler = $("#nameInput").val().trim();

  //This pulls today's date
  var rightNow = moment().valueOf()
  console.log("date of booking: " + rightNow);
  
  // This is a simulated "start" date so I can test percentages or progress
  var fakeToday = new Date("2019-01-09");
  var dateOfBooking = fakeToday.getTime();
  console.log("date of booking: " + dateOfBooking);
  
  // This is pulling the depart date input
  var date1 = new Date($("#departDateInput").val()).getTime();
  console.log("departure: " + date1);
  
  // days from when you booked until now
  var totalDaysLeft = Math.floor((date1 - rightNow) / 86400000);
  console.log("days between when you started until now: " + totalDaysLeft);
  
  // days between that fake start day & current time
  var howManyHasItBeen = Math.floor((rightNow - dateOfBooking) / 86400000);
  console.log("Total goal length: " + howManyHasItBeen);
  
  // total trip days
  var totalTripDays = Math.floor((date1 - dateOfBooking) / 86400000);
  
  // this get the percentage of the trip that's done
  var progressBar = howManyHasItBeen / totalTripDays * 100;
  var cleanPercentage = Math.round(progressBar);
  console.log("To what percent am I done: " + cleanPercentage);
  
  // this pushes that percentage to the progress bar, finall
  $("#destinationProgress").attr("style", "width: " + cleanPercentage + "%").attr("aria-valuenow", cleanPercentage);
  
  
  
  
  
  if(testAPIMode){
    var queryURL = "https://apidojo-kayak-v1.p.rapidapi.com/flights/create-session?origin1=" + startLocation + "&destination1=" + endLocation + "&departdate1=" + departdate + "&cabin=e&currency=USD&adults=1&bags=0";
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
      console.log(response);
      var yourTripCost = response.cheapestPriceTotal;

      $("#output").text(yourTripCost);
      console.log(yourTripCost);

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
            yourTripCost: yourTripCost,
            dateOfBooking: dateOfBooking,
            cleanPercentage: cleanPercentage
          })
          database.ref(`/users/${username}/searches`).set(userSearchesArr)
        }
        searchesArr.push({
          name: name,
          plannedOn: `${month}/${day}/${year}`,
          startLoc: startLocation,
          endLoc: endLocation,
          leaveDate: departdate,
          yourTripCost: yourTripCost,
          dateOfBooking: dateOfBooking,
          cleanPercentage: cleanPercentage
        })
        database.ref('/searches').set(searchesArr)
      })
      
      updateTable()
    });
  }
})

// I'm trying to add the function so that when you add a child to the table, it will add information to the final page
database.ref('/searches').on('child_added', function(snap){
$(`#travelerName`).text("Name: " + snap.val().name);
$(`#destination`).text("Destination: " + snap.val().endLoc);
$('#departureDate').text("You are leaving on: " + snap.val().leaveDate);
$('#whenBooked').text("You booked this trip on: " + snap.val().dateOfBooking);
$('#tripCost').text("Your total trip will cost: " + snap.val().yourTripCost);
$('#percentComplete').text("You are " + snap.val().cleanPercentage + " of the way there!");
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
