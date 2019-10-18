//* Global variables
let nickname = ""
//? do i need users as global?
let users
let startListening

//* Shortcuts
const create = tag => document.createElement(tag)

// Creates alert div for login and register forms
const placeAlert = (parent, alertType, alertText) => {
   if (parent.firstChild.tagName !== "FORM")
      parent.removeChild(parent.firstChild)
   let loginAlert = create("div")
   loginAlert.classList.add(
      "ml-auto",
      "mr-auto",
      "col-lg-6",
      "alert",
      `alert-${alertType}`
   )
   loginAlert.innerText = alertText
   parent.prepend(loginAlert)
}

const placeMessage = ({ name, date, message, imageMsg, id }) => {
   let messageNode = create("p")
   messageNode.id = id
   let timeSpan = create("span")
   timeSpan.innerText = `<<${date}>> `
   timeSpan.style.fontWeight = "lighter"
   timeSpan.style.fontStyle = "italic"
   timeSpan.style.fontSize = "0.75rem"
   timeSpan.style.color = "grey"
   messageNode.appendChild(timeSpan)
   let userSpan = create("span")
   userSpan.innerText = `${name}: `
   name === nickname
      ? (userSpan.style.color = "orange")
      : (userSpan.style.color = "blue")
   messageNode.appendChild(userSpan)
   //if text
   if (message) {
      let msg = create("span")
      msg.innerText = message
      messageNode.appendChild(msg)
   }
   // if image
   else {
      let img = create("img")
      img.src = imageMsg
      img.style.width = "300px"
      messageNode.appendChild(img)
   }
   messagesContainer.appendChild(messageNode)
   messageNode.scrollIntoView({ block: "end", behavior: "smooth" })
}

let readAndHash = inputTagId => {
   let sha = new jsSHA("SHA-256", "TEXT")
   sha.update(inputTagId.value)
   return sha.getHash("HEX")
}

//* Event Handlers
loginForm.onsubmit = async event => {
   event.preventDefault()
   if (nicknameInp.value !== "" && passwordInp.value !== "") {
      nickname = loginForm.nickname.value
      loginForm.nickname.value = ""
      let password
      //if event initiated by user we  need to hash his password
      if (event.isTrusted) password = readAndHash(loginForm.password)
      //otherwise we will read it from local storage and give to input
      //its hashed already (this is a part of "remember me" logic)
      else password = loginForm.password.value
      loginForm.password.value = ""
      formBtn.innerText = "  Checking..."
      let spinner = create("span")
      spinner.classList.add("spinner-border", "spinner-border-sm")
      formBtn.prepend(spinner)
      let usersRequest = await fetch("/users")
      users = await usersRequest.json()
      let userFound = users.find(
         user => user.name === nickname && user.password === password
      )
      if (userFound) {
        userNick.innerText = nickname
         rememberCheck.checked
            ? localStorage.setItem(
                 "rememberedUser",
                 JSON.stringify([nickname, password])
              )
            : null
         loginContainer.classList.add("d-none")
         chatContainer.classList.remove("d-none")
         startListening = setInterval(async () => {
            let historyRequest = await fetch("/messages")
            let history = await historyRequest.json()
            for (let msg of history)
               if (
                  !messagesContainer.lastChild ||
                  +msg.id > +messagesContainer.lastChild.id
               )
                  placeMessage(msg)
         }, 1500)
      } else {
         let alertText = "Password incorrect or user was not found"
         placeAlert(loginContainer, "danger", alertText)
      }
   } else {
      let alertText = "Either nickname or password was not filled"
      placeAlert(loginContainer, "warning", alertText)
   }
   formBtn.innerText = "Login"
}

registerForm.onsubmit = async event => {
   event.preventDefault()
   if (regnameInp.value !== "" && regpassInp.value !== "") {
      regBtn.innerText = "  Checking..."
      let spinner = create("span")
      spinner.classList.add("spinner-border", "spinner-border-sm")
      regBtn.prepend(spinner)
      let usersRequest = await fetch("/users")
      users = await usersRequest.json()
      let userAttemp = registerForm.nickname.value
      let userFound = users.find(user => user.name === userAttemp)
      if (!userFound) {
         registerForm.nickname.value = ""
         let password = readAndHash(registerForm.password)
         registerForm.password.value = ""
         let postNewUser = await fetch("/users", {
            method: "POST",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: userAttemp, password: password })
         })
         if (postNewUser.status < 305 && postNewUser.status > 199) {
            let alertText =
               "Registration successful, thank you! You can go BACK and login now"
            placeAlert(registrationContainer, "success", alertText)
         } else {
            let alertText = "Something went wrong, please try again"
            placeAlert(registrationContainer, "danger", alertText)
         }
      } else {
         let alertText = "Such user already exists. Try another name"
         placeAlert(registrationContainer, "danger", alertText)
      }
   } else {
      let alertText = "Either nickname or password was not filled"
      placeAlert(registrationContainer, "warning", alertText)
   }
   regBtn.innerText = "Create account"
}

//TODO logout btn
//TODO forget me chckbox

createBadge.onclick = event => {
   event.preventDefault()
   loginContainer.classList.add("d-none")
   registrationContainer.classList.remove("d-none")
   if (loginContainer.firstChild.tagName !== "FORM")
      loginContainer.removeChild(loginContainer.firstChild)
}

gobackBadge.onclick = event => {
   event.preventDefault()
   loginContainer.classList.remove("d-none")
   registrationContainer.classList.add("d-none")
   if (registrationContainer.firstChild.tagName !== "FORM")
      registrationContainer.removeChild(registrationContainer.firstChild)
}

logoutBtn.onclick = event => {
  event.preventDefault()
  loginContainer.classList.remove("d-none")
  chatContainer.classList.add("d-none")
  localStorage.clear()
  clearInterval(startListening)
}

msgForm.onsubmit = async event => {
   event.preventDefault()
   let { value: newMsg } = msgInp
   msgInp.value = ""
   let curDate = new Date()
   let dateStr = curDate.toLocaleString()
   if (newMsg !== "") {
      let msgSentToServer = await fetch("/messages", {
         method: "POST",
         headers: {
            "Content-Type": "application/json"
         },
         body: JSON.stringify({
            name: nickname,
            date: dateStr,
            message: newMsg
         })
      })
      let reply = await msgSentToServer.json()
      placeMessage(reply)
   }
}

sendImgBtn.onclick = async () => {
   //*reading image
   let { files: uploadedFiles } = fileInput
   fileLabel.innerText = "Choose file..."
   if (uploadedFiles.length) {
      let fileReader = new FileReader()
      fileReader.onload = async event => {
         let baseData = event.target.result
         let curDate = new Date()
         let dateStr = curDate.toLocaleString()
         let imgSentToServer = await fetch("/messages", {
            method: "POST",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify({
               name: nickname,
               date: dateStr,
               imageMsg: baseData
            })
         })
         let reply = await imgSentToServer.json()
         placeMessage(reply)
      }
      fileReader.readAsDataURL(uploadedFiles[0])
   }
}

let returnFileSize = number => {
  if(number < 1024) {
    return number + 'bytes';
  } else if(number > 1024 && number < 1048576) {
    return (number/1024).toFixed(1) + 'KB';
  } else if(number > 1048576) {
    return (number/1048576).toFixed(1) + 'MB';
  }
}

fileInput.onchange = () => {
  let size = returnFileSize(fileInput.files[0].size)
   fileLabel.innerText = `"${fileInput.files[0].name}", ${size}`
}

//this is "remember me" logic
;(function checkLocal() {
   let user = JSON.parse(localStorage.getItem("rememberedUser"))
   if (user) {
      nicknameInp.value = user[0]
      passwordInp.value = user[1]
      let submit = new Event("submit")
      loginForm.dispatchEvent(submit)
   }
})()

//TODO private rooms, friends
//TODO make userNick font-size adaptive by nickname.length
//TODO account settings, avatar, title
//TODO statuses (online, offline, invisible, afk)
//TODO system messages in chat
//! bootstrap nav tabs for chatrooms, last one always dropdown, list of users (search?)
//! vertical pills!!