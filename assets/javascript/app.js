var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectID = ''
var userLoggedIn = false

var testAPIMode = true
var cheapestPriceTotal = 100;

// Pulls search data from the database and hands it off to populateTables() to update page
function updateTable() {
  $('#myTrips').empty()
  $('#ourTrips').empty()
  database.ref().once('value', function (snap) {
    if (userLoggedIn) {
      $('#myTripsTable').removeClass('hidden-element')
      var username = snap.val().connections[connectID].user
      var userSearches = snap.val().users[username].searches.filter(Boolean)
      database.ref(`/users/${username}/searches`).set(userSearches)
      populateTables('myTrips', userSearches)
    } else {
      $('#myTripsTable').addClass('hidden-element')
    }
    var searches = snap.val().searches.filter(Boolean)
    database.ref(`/searches`).set(searches)
    populateTables('ourTrips', searches)
  })
}
// Appends search data from database into one of the two tables (based on arguments passed)
function populateTables(table, data) {
  if (data.length > 0) {
    var amountToShow = data.length > 10 ? 10 : data.length
    for (i = 0; i < amountToShow; i++) {
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

function loadSpecificSearch(index, user) {
  database.ref().once('value', function (snap) {
    var searchObj
    if (userLoggedIn) {
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
    var cleanPercentage = Math.round(progressBar);
    var oneDayPercent = Math.round(1 / totalTripDays * 100)
    totalTripPrice = searchObj.tripPrice ? searchObj.tripPrice : 4242
    // this pushes that percentage to the progress bar, finall
    $("#destinationProgress").attr("style", "width: " + cleanPercentage + "%").attr("aria-valuenow", cleanPercentage);
    bing_image_search(searchObj.term)

    $('.travelerName').text(searchObj.name ? searchObj.name : 'Philip J Fry')
    $('.startingLocation').text(searchObj.startLoc ? searchObj.startLoc : 'DFW')
    $('.destinationName').text(searchObj.endLoc? searchObj.endLoc : 'PHL')
    $('.departureDate').text(moment(searchObj.leaveDate).format("MM/DD/YYYY"))
    $('.plannedOnDate').text(moment(searchObj.plannedOn).format("MM/DD/YYYY"))
    $('.percentToLeave').text(`${cleanPercentage}%`)
    $('.totalTripCost').text(`$${totalTripPrice}`)
    $('.amountSavePerDay').text(`$${(totalTripPrice / (totalTripDays ? totalTripDays : 1)).toFixed(2)}`)
    $('.amountCurrentlySaved').text(`$${(totalTripPrice * (cleanPercentage / 100)).toFixed(2)}`)
    $('.amountLeftToSave').text(`$${(totalTripPrice * ((100 - cleanPercentage) / 100)).toFixed(2)}`)
  })
}

$(document).on('click', "#loadSearchPage", function () {
  loadSpecificSearch($(this).data('search'), $(this).data('user'))
})

$(document).on('click', '.switch-element-btn', function() {
  var showPage = $(this).data('show');
  var hidePage = $(this).data('hide');
  $(`#${hidePage}`).addClass('disappear');
  $(`#${showPage}`).addClass('disappear');
  setTimeout(function() {
      $(`#${hidePage}`).addClass('hidden-element');
      $(`#${hidePage}`).removeClass('disappear');
      $(`#${showPage}`).removeClass('hidden-element');
      setTimeout(function() {
          $(`#${showPage}`).removeClass('disappear');
      }, 250)
  }, 700);
})

$(document).on('click', '.quick-switch-btn', function() {
  var showPage = $(this).data('show');
  var hidePage = $(this).data('hide');
  $(`#${hidePage}`).addClass('hidden-element');
  $(`#${showPage}`).removeClass('hidden-element');
})

$(document).on('click', '.home-btn', function() {
  $("#searchPage").addClass('hidden-element');
  $("#originPage").addClass('hidden-element');
  $("#tripPage").removeClass('hidden-element');
  $("#selectionPage").addClass('hidden-element');
  $("#destinationPage").addClass('hidden-element');
  $("#landingPage").removeClass('hidden-element');
})

$('#showSelectionPage').on('click', function () {
  updateTable()
})

$(document).on('click', '.home-btn', function () {
  $("#searchPage").addClass('hidden-element');
  $("#originPage").addClass('hidden-element');
  $("#tripPage").removeClass('hidden-element');
  $("#selectionPage").addClass('hidden-element');
  $("#destinationPage").addClass('hidden-element');
  $("#landingPage").removeClass('hidden-element');
})

$('#submit-btn').on('click', function () {
  var name = $('#nameInput').val()
  var startLocation = $('#originInput').val()
  var endLocation = $('#destinationInput').val()
  var term = $("#cityDestination").val();

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

  if (testAPIMode) {
    var queryURL = "https://apidojo-kayak-v1.p.rapidapi.com/flights/create-session?origin1=" + startLocation + "&destination1=" + endLocation + "&departdate1=" + moment(departDate).format('YYYY-MM-DD') + "&cabin=e&currency=USD&adults=1&bags=0";
    // var APIkey = "c9b53cf803msh302e1160032e5ffp16e9dbjsn3ccee16556b6";
    $("#output").append(`
      <div class="fa-3x">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    `)
    $.ajax({
      url: queryURL,
      headers: { "X-RapidAPI-Key": "7eb4efc85dmshdb58c9c105cc67ep10f420jsn7c5d7db36997" },
      method: "GET"
    }).then(function (response) {
      bing_image_search(term)
      var price = response.cheapestPriceTotal
      var searchData = {
        name: name,
        plannedOn: rightNow,
        startLoc: startLocation,
        endLoc: endLocation,
        leaveDate: departDate,
        tripPrice: price,
        term: term,
      }
      database.ref().once('value', function (snap) {
        var username = snap.val().connections[connectID].user
        var searchesArr = snap.val().searches.filter(Boolean)
        var userSearchesArr

        searchesArr.push(searchData)
        database.ref('/searches').set(searchesArr)

        if (userLoggedIn) {
          userSearchesArr = snap.val().users[username].searches.filter(Boolean)
          userSearchesArr.push(searchData)
          database.ref(`/users/${username}/searches`).set(userSearchesArr)
          loadSpecificSearch(userSearchesArr.length - 1, username)
        } else {
          loadSpecificSearch(searchesArr.length - 1, false)
        }
      })
    });
  }
})


// Testing Google Auth
$('#login-info').on('click', function () {
  event.preventDefault()
  firebase.auth().signInWithPopup(provider).then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    var username = user.email.substring(0, user.email.indexOf('@'))
    var userEmail = user.email
    $('#login-info').html(`<p>${username}</p>`)
    database.ref('/users').once('value', function (snap) {
      if (!snap.val()[username]) {
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

  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
  });
})

database.ref('.info/connected').on('value', (snap) => {
  if (snap.val()) {
    var con = database.ref('/connections').push(true)
    connectID = con.key

    con.onDisconnect().remove()
  }
})




// Here's the image API
var subscriptionKey = '6c5d779f5daf4b03bac96cf0184fe9e7';

var host = 'https://api.cognitive.microsoft.com';
var path = '/bing/v7.0/images/search?q=';

var response_handler = function (response) {
    let body = '';
    response.on('data', function (d) {
        body += d;
    });
    response.on('end', function () {
        console.log('\nRelevant Headers:\n');
        for (var header in response.headers)
            // header keys are lower-cased by Node.js
            if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
                 console.log(header + ": " + response.headers[header]);
        body = JSON.stringify(JSON.parse(body), null, '  ');
        console.log('\nJSON Response:\n');
        console.log(body);
    });
    response.on('error', function (e) {
        console.log('Error: ' + e.message);
    });
};

var bing_image_search = function (search) {
  console.log('Searching images for: ' + search);
  let request_params = {
        method : 'GET',
        url : host + path + search,
        headers : {
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };
    $.ajax (request_params).then(function (response){
      $("#destinationImage").attr("src", response.value[0].thumbnailUrl);
      console.log(response.value[0].thumbnailUrl);
  });
}

// if (subscriptionKey.length === 32) {
//     bing_image_search(term);
// } else {
//     console.log('Invalid Bing Search API subscription key!');
//     console.log('Please paste yours into the source code.');
// }
