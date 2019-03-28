var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectID = ''
var userLoggedIn = false

var testAPIMode = true
var cheapestPriceTotal = 100;

// Pulls search data from the database and hands it off to populateTables() to update page
function updateTable(){
  $('#myTrips').empty()
  $('#ourTrips').empty()
  database.ref().once('value', function(snap){
    if(userLoggedIn){
      $('#myTripsTable').removeClass('hidden-element')
      var username = snap.val().connections[connectID].user
      var userSearches = snap.val().users[username].searches.filter(Boolean)
      populateTables('myTrips', userSearches)
    } else {
      $('#myTripsTable').addClass('hidden-element')
    }
    var searches = snap.val().searches.filter(Boolean)
    populateTables('ourTrips', searches)
  })
}
// Appends search data from database into one of the two tables (based on arguments passed)
function populateTables(table, data){
  if(data.length > 0){
    var amountToShow = data.length > 10 ? 10 : data.length
    for(i=0;i<amountToShow;i++){
      $(`#${table}`).append(`
        <tr>
        <th scope="col">${data[data.length - 1 - i].name}</th>
        <th scope="col">${data[data.length - 1 - i].endLoc}</th>
        <th scope="col">${moment(data[data.length - 1 - i].plannedOn).format("MM/DD/YYYY")}</th>
        <th scope="col">${moment(data[data.length - 1 - i].leaveDate).format("MM/DD/YYYY")}</th>
        <th scope="col"><button class="switch-element-btn" id="loadSearchPage" data-hide="selectionPage" data-show="destinationPage" data-search="${data.length - 1 - i}" data-user="true">Button</button></th>
        </tr>
      `)
    }
  }
}

function loadSpecificSearch(index, user){
  database.ref().once('value', function(snap){
    var searchObj
    if(userLoggedIn){
      searchObj = snap.val().users[snap.val().connections[connectID].user].searches[index]
    } else {
      searchObj = snap.val().searches[index]
    }
    // Currnet date in UNIX
    var rightNow = moment().valueOf()
    // This is pulling the depart date input
    var plannedOn = searchObj.plannedOn
    var departDate = searchObj.leaveDate
    // days from when you booked until now
    var totalDaysLeft = Math.floor((departDate - rightNow) / 86400000);
    // days between that fake start day & current time
    var howManyHasItBeen = Math.floor((rightNow - plannedOn) / 86400000);
    // total trip days
    var totalTripDays = Math.floor((departDate - plannedOn) / 86400000);
    // this get the percentage of the trip that's done
    var progressBar = howManyHasItBeen / totalTripDays * 100;
    var cleanPercentage = Math.round(progressBar) ? Math.round(progressBar) : 0;
    console.log("To what percent am I done: " + cleanPercentage);
    var oneDayPercent = Math.round(1 / totalTripDays * 100)
    totalTripPrice = searchObj.tripPrice ? searchObj.tripPrice : 4242
    // this pushes that percentage to the progress bar, finall
    $("#destinationProgress").attr("style", "width: " + cleanPercentage + "%").attr("aria-valuenow", cleanPercentage);

    $('.travelerName').text(searchObj.name)
    $('.startingLocation').text(searchObj.startLoc)
    $('.destinationName').text(searchObj.endLoc)
    $('.departureDate').text(moment(searchObj.leaveDate).format("MM/DD/YYYY"))
    $('.plannedOnDate').text(moment(searchObj.plannedOn).format("MM/DD/YYYY"))
    $('.percentToLeave').text(`${cleanPercentage}%`)
    $('.totalTripCost').text(`$${totalTripPrice}`)
    $('.amountSavePerDay').text(`$${(totalTripPrice * (oneDayPercent / 100)).toFixed(2)}`)
    $('.amountCurrentlySaved').text(`$${(totalTripPrice * (cleanPercentage / 100)).toFixed(2)}`)
    $('.amountLeftToSave').text(`$${(totalTripPrice * ((100 - cleanPercentage) / 100)).toFixed(2)}`)
  })
}

$(document).on('click', "#loadSearchPage", function(){
  loadSpecificSearch($(this).data('search'), $(this).data('user'))
})
$(document).on('click', '.switch-element-btn', function(){
  var hideElement = $(this).data('hide')
  var showElement = $(this).data('show')
  $(`#${hideElement}`).addClass('hidden-element')
  $(`#${showElement}`).removeClass('hidden-element')
})
$('#showSelectionPage').on('click', function(){
  updateTable()
})
$(document).on('click', '.home-btn', function(){
    $("#searchPage").addClass('hidden-element');
    $("#originPage").addClass('hidden-element');
    $("#tripPage").removeClass('hidden-element');
    $("#selectionPage").addClass('hidden-element');
    $("#destinationPage").addClass('hidden-element');
    $("#landingPage").removeClass('hidden-element');
})

$('#submit-btn').on('click', function(){
  var name = $('#nameInput').val()
  var startLocation = $('#originInput').val()
  var endLocation = $('#destinationInput').val()

  var traveler = $("#nameInput").val().trim();
  $("#travelerName").text("Name: " + traveler);
  // 2019-04-01

  //This pulls today's date
  var rightNow = moment().valueOf()
  console.log("date of booking: " + rightNow);

  // This is pulling the depart date input
  var departDate = new Date($("#departDateInput").val()).getTime();

  // days from when you booked until now
  var totalDaysLeft = Math.floor((departDate - rightNow) / 86400000);
  console.log("days between when you started until now: " + totalDaysLeft);

  if(testAPIMode){
    var queryURL = "https://apidojo-kayak-v1.p.rapidapi.com/flights/create-session?origin1=" + startLocation + "&destination1=" + endLocation + "&departdate1=" + moment(departDate).format('YYYY-MM-DD') + "&cabin=e&currency=USD&adults=1&bags=0";
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
      console.log(response)
      console.log(response.cheapestPriceTotal);
      var price = response.cheapestPriceTotal
      var searchData = {
        name: name,
        plannedOn: rightNow,
        startLoc: startLocation,
        endLoc: endLocation,
        leaveDate: departDate,
        tripPrice: price,
      }
      database.ref().once('value', function(snap){
        var username = snap.val().connections[connectID].user
        var searchesArr = snap.val().searches.filter(Boolean)
        var userSearchesArr

        searchesArr.push(searchData)
        database.ref('/searches').set(searchesArr)

        if(userLoggedIn){
          userSearchesArr = snap.val().users[username].searches.filter(Boolean)
          userSearchesArr.push(searchData)
          database.ref(`/users/${username}/searches`).set(userSearchesArr)
          loadSpecificSearch(userSearchesArr.length-1, username)
        } else {
          loadSpecificSearch(searchesArr.length-1, false)
        }
      })
    });
  }
})

// Testing Google Auth
$('#google-login-btn').on('click', function(){
  event.preventDefault()
  firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    var username = user.email.substring(0, user.email.indexOf('@'))
    var userEmail = user.email
    $('#login-info').html(`<p>${username}</p>`)
    database.ref('/users').once('value', function(snap){
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
