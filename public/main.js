//* Global variables
let nickname = ""
//? do i need users as global?
let users
let startListening
let editInProgress = false
let passStrength = new RegExp(
   "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
)

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

const createClickBadge = (text, type) => {
   let badge = create("a")
   badge.innerText = text
   badge.classList.add("badge", `badge-${type}`)
   badge.style.color = "white"
   badge.style.fontSize = "0.7rem"
   badge.style.display = "none"
   badge.style.cursor = "pointer"
   return badge
}

const resetVisibility = (editState, name) => {
   let ownMessages = [...document.getElementsByClassName(`${name}`)]
   if (editState) {
      ownMessages.forEach(elem => {
         elem.onmouseover = () => {
            elem.lastChild.style.display = "inline"
            if (![...elem.classList].includes("image"))
               elem.lastChild.previousSibling.style.display = "inline"
         }
         elem.onmouseout = () => {
            elem.lastChild.style.display = "none"
            if (![...elem.classList].includes("image"))
               elem.lastChild.previousSibling.style.display = "none"
         }
      })
   } else
      ownMessages.forEach(elem => {
         elem.onmouseover = () => null
         elem.onmouseout = () => null
      })
}

const placeMessage = ({ name, date, message, imageMsg, id }) => {
   let messageNode = create("p")
   messageNode.id = id
   messageNode.classList.add(`${name}`)
   //message editing
   let editor = createClickBadge("Edit", "primary")
   editor.onclick = async () => {
      let hitEnter = event => {
         if (event.key === "Enter") {
            event.preventDefault()
            editor.onclick()
         }
      }
      if (!editInProgress) {
         resetVisibility(editInProgress, name)
         editInProgress = true
         editor.innerText = "Save"
         editor.previousSibling.style.outline = "1px solid lightblue"
         editor.previousSibling.setAttribute("contentEditable", "true")
         messageNode.addEventListener("keydown", hitEnter)
      } else {
         resetVisibility(editInProgress, name)
         editInProgress = false
         editor.innerText = "Edit"
         editor.style.display = "none"
         editor.previousSibling.style.outline = "none"
         editor.previousSibling.setAttribute("contentEditable", "false")
         messageNode.removeEventListener("keydown", hitEnter)
         let msgPatchedOnServer = await fetch(`/messages/${id}`, {
            method: "PATCH",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: editor.previousSibling.innerText })
         })
         let reply = await msgPatchedOnServer.json()
         editor.previousSibling.innerText = reply.message
      }
   }

   let remover = createClickBadge("Delete", "danger")
   remover.onclick = () => {
      let modalConfirm = new Modal(confirmBox)
      modalConfirm.show()
      confirmBtn.onclick = async () => {
         let id = remover.parentNode.id
         await fetch(`/messages/${id}`, {
            method: "DELETE",
            headers: {
               "Content-Type": "application/json"
            }
         })
         remover.parentNode.parentNode.removeChild(remover.parentNode)
         modalConfirm.hide()
      }
   }

   //making other editors visible/invisible while editing in progress
   if (name == nickname) {
      if (message) {
         messageNode.onmouseover = () => {
            editor.style.display = "inline"
            remover.style.display = "inline"
         }
         messageNode.onmouseout = () => {
            editor.style.display = "none"
            remover.style.display = "none"
         }
      }
      if (imageMsg) {
         messageNode.onmouseover = () => {
            remover.style.display = "inline"
         }
         messageNode.onmouseout = () => {
            remover.style.display = "none"
         }
      }
   }
   //adding time
   let timeSpan = create("span")
   timeSpan.innerText = `<<${date}>> `
   timeSpan.style.fontWeight = "lighter"
   timeSpan.style.fontStyle = "italic"
   timeSpan.style.fontSize = "0.75rem"
   timeSpan.style.color = "grey"
   messageNode.appendChild(timeSpan)
   //adding username
   let userSpan = create("span")
   userSpan.innerText = `${name}: `
   name === nickname
      ? (userSpan.style.color = "orange")
      : (userSpan.style.color = "blue")
   messageNode.appendChild(userSpan)
   //adding text
   if (message) {
      let msg = create("span")
      msg.innerText = `${message}  `
      messageNode.appendChild(msg)
   }
   //adding image
   else {
      let img = create("img")
      img.src = imageMsg
      img.style.width = "250px"
      //this class is used in messages editing
      messageNode.classList.add("image")
      messageNode.appendChild(img)
   }
   messageNode.appendChild(editor)
   messageNode.appendChild(remover)

   messagesContainer.appendChild(messageNode)
   //! may be message container scroll into view?
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
      //if event initiated by user we need to hash his password
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
         if (userFound.avatar) {
            profilePicture.src = userFound.avatar
            userAvatar.src = userFound.avatar
         } 
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
      if (passStrength.test(regpassInp.value)) {
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
         let alertText =
            "Password should be minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character. Please try again"
         placeAlert(registrationContainer, "warning", alertText)
      }
   } else {
      let alertText = "Either nickname or password was not filled"
      placeAlert(registrationContainer, "warning", alertText)
   }
   regBtn.innerText = "Create account"
}

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
   nickname = ''
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
   if (number < 1024) {
      return number + "bytes"
   } else if (number > 1024 && number < 1048576) {
      return (number / 1024).toFixed(1) + "KB"
   } else if (number > 1048576) {
      return (number / 1048576).toFixed(1) + "MB"
   }
}

fileInput.onchange = () => {
   if (fileInput.files.length) {
      let size = returnFileSize(fileInput.files[0].size)
      fileLabel.innerText = `"${fileInput.files[0].name}", ${size}`
   } 
   else fileLabel.innerText = 'Choose image...'
}

//initializing "remember me" logic
;(function checkLocal() {
   let user = JSON.parse(localStorage.getItem("rememberedUser"))
   if (user) {
      nicknameInp.value = user[0]
      passwordInp.value = user[1]
      let submit = new Event("submit")
      loginForm.dispatchEvent(submit)
   }
})()

userAvatar.style.cursor = "pointer"
userNick.style.cursor = "pointer"

userAvatar.onclick = () => {
   chatContainer.classList.add("d-none")
   profileContainer.classList.remove("d-none")
}

userNick.onclick = () => userAvatar.onclick()

exitProfile.onclick = () => {
   if (passAlertHolder.firstChild.tagName !== "FORM")
      passAlertHolder.removeChild(passAlertHolder.firstChild)
   chatContainer.classList.remove("d-none")
   profileContainer.classList.add("d-none")
}

changePassForm.onsubmit = async () => {
   event.preventDefault()
   if (
      oldPassInp.value !== "" &&
      newPassInp.value !== "" &&
      confirmNewPassInp.value !== ""
   ) {
      if (newPassInp.value === confirmNewPassInp.value) {
         if (passStrength.test(newPassInp.value)) {
            let oldPass = readAndHash(oldPassInp)
            changePassFormBtn.innerText = "  Checking..."
            let spinner = create("span")
            spinner.classList.add("spinner-border", "spinner-border-sm")
            changePassFormBtn.prepend(spinner)
            let userRequest = await fetch(`/users?name=${nickname}`)
            user = await userRequest.json()
            let id = user[0].id
            if (oldPass == user[0].password) {
               let newPass = readAndHash(newPassInp)
               confirmNewPassInp.value = ""
               confirmNewPassInp.style.outline = 'none'
               oldPassInp.value = "" 
               newPassInp.value = "" 
               let patchPassword = await fetch(`/users/${id}`, {
                  method: "PATCH",
                  headers: {
                     "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ password: newPass })
               })
               if (patchPassword.status < 305 && patchPassword.status > 199) {
                  let alertText =
                     "Password was successfuly changed!"
                     placeAlert(passAlertHolder, "success", alertText)
                     passAlertHolder.firstChild.classList.remove("col-lg-6")
               } else {
                  let alertText = "Something went wrong, please try again"
                  placeAlert(passAlertHolder, "danger", alertText)
               }
            } else {
               let alertText = "Incorrect old password!"
               placeAlert(passAlertHolder, "danger", alertText)
               passAlertHolder.firstChild.classList.remove("col-lg-6")
            }
         } else {
            let alertText =
               "Password should be minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character. Please try again"
            placeAlert(passAlertHolder, "warning", alertText)
            passAlertHolder.firstChild.classList.remove("col-lg-6")
         }
      } else {
         let alertText = "New password and confirm new password does not match"
         placeAlert(passAlertHolder, "danger", alertText)
         passAlertHolder.firstChild.classList.remove("col-lg-6")
      }
   } else {
      let alertText =
         "Please old password, new password and confirm new password"
      placeAlert(passAlertHolder, "warning", alertText)
      passAlertHolder.firstChild.classList.remove("col-lg-6")
   }
   changePassFormBtn.innerText = "Change password"
}

confirmNewPassInp.oninput = () => {
   if (newPassInp.value !== "" && confirmNewPassInp.value !== "") {
      confirmNewPassInp.style.outline = "double 2px red"
      if (newPassInp.value === confirmNewPassInp.value)
         confirmNewPassInp.style.outline = "double 2px green"
   } else confirmNewPassInp.style.outline = "none"
}



//TODO private rooms, friends
//TODO make userNick font-size adaptive by nickname.length
//TODO account settings, avatar, 
//TODO statuses (online, offline, invisible, afk)
