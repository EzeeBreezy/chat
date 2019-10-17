let nickname = ""
let users

const create = tag => document.createElement(tag)

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

const placeMessage = ({ name, message, imageMsg, id }) => {
  //TODO message date&time
  let messageNode = create("p")
  messageNode.id = id
  let userSpan = create("span")
  userSpan.innerText = `${name}: `
  name === nickname
    ? (userSpan.style.color = "orange")
    : (userSpan.style.color = "blue")
    //**if text */
    if (message) {
        let msg = create("span")
        msg.innerText = message
        messageNode.appendChild(userSpan)
        messageNode.appendChild(msg)
    }
    else {
        let img = create("img")
        img.src = imageMsg
        img.style.width = '300px'
        messageNode.appendChild(userSpan)
        messageNode.appendChild(img)
    }

  messagesContainer.appendChild(messageNode)
  messageNode.scrollIntoView({block: "end", behavior: "smooth"})
}

loginForm.onsubmit = async event => {
  event.preventDefault()
  if (nicknameInp.value !== "" && passwordInp.value !== "") {
    nickname = loginForm.nickname.value
    loginForm.nickname.value = ""
    let password = loginForm.password.value
    loginForm.password.value = ""
    formBtn.innerText = "  Checking..."
    let spinner = create("span")
    spinner.classList.add("spinner-border", "spinner-border-sm")
    formBtn.prepend(spinner)
    let usersRequest = await fetch("/users")
    users = await usersRequest.json()
    //TODO check if remember me checked (keep in cookie?)
    let userFound = users.find(
      user => user.name === nickname && user.password === password
    )
    if (userFound) {
      loginContainer.classList.add("d-none")
      chatContainer.classList.remove("d-none")
      let startListening = setInterval(async () => {
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
      let password = registerForm.password.value
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

msgForm.onsubmit = async event => {
  event.preventDefault()
  let { value: newMsg } = msgInp
  msgInp.value = ""
  if (newMsg !== "") {
    let msgSentToServer = await fetch("/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: nickname, message: newMsg })
    })
    let reply = await msgSentToServer.json()
    placeMessage(reply)
  }
}

sendImgBtn.onclick = async () => {
        //*reading image
  let { files: uploadedFiles } = fileInput
  fileInput.files[0] = null
  fileLabel.innerText = "Choose file..."
  if (uploadedFiles.length) {
    let fileReader = new FileReader()
    fileReader.onload = async event => {
        let baseData = event.target.result
        let imgSentToServer = await fetch("/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: nickname, imageMsg: baseData })
          })
        let reply = await imgSentToServer.json()
        placeMessage(reply)

    }
    fileReader.readAsDataURL(uploadedFiles[0])
  }
}

fileInput.onchange = () => {
     fileLabel.innerText = fileInput.files[0].name
    
}


//! onchange for input => change label and enable upload btn


//TODO private rooms, friends
  //TODO hash mb?
  //TODO sending pictures
  //TODO account settings, avatar, title
  //TODO smiles?
  //TODO sedning files?
  //TODO statuses (online, offline, invisible, afk)
//TODO system messages in chat

//* hashing tips
// var shaObj = new jsSHA("SHA-512", "TEXT");
// shaObj.update("This is a ");
// shaObj.update("test");
// var hash = shaObj.getHash("HEX");