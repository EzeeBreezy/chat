let nickname = '', password = ''
//TODO no need to keep pwd, should let it die inside onsubmit
const create = tag => document.createElement(tag)

const placeAlert = (alertType, alertText) => {
    if (loginContainer.firstChild.tagName !== 'FORM')
        loginContainer.removeChild(loginContainer.firstChild)
    let loginAlert = create('div')
    loginAlert.classList.add("ml-auto", "mr-auto", "col-lg-6", "alert", `alert-${alertType}`)
    loginAlert.innerText = alertText
    loginContainer.prepend(loginAlert)
}

const placeMessage = ({name, message}) => {
                    //TODO message date&time
    let messageNode = create('p')
    let userSpan = create('span')
    userSpan.innerText = `${name}: `
    name === nickname
        ? userSpan.style.color = 'orange'
        : userSpan.style.color = 'blue'
    let msg = create('span')
    msg.innerText = message
    messageNode.appendChild(userSpan)
    messageNode.appendChild(msg)
    messagesContainer.appendChild(messageNode)
}

loginForm.onsubmit = async event => {
    event.preventDefault()
    if (nicknameInp.value !== '' && passwordInp.value !== '') {
        nickname = loginForm.nickname.value
        loginForm.nickname.value = ''
        password = loginForm.password.value
        loginForm.password.value = ''
        formBtn.innerText = '  Checking...'
        let spinner = create('span')
        spinner.classList.add("spinner-border", "spinner-border-sm")
        formBtn.prepend(spinner)
        //TODO registration form
        let usersRequest = await fetch('/users')
        let users = await usersRequest.json()
                //TODO check if remember me checked (keep in cookie?)
        let userFound = users.find(user => user.name === nickname && user.password === password)
        if (userFound) {
            loginContainer.classList.add('d-none')
            chatContainer.classList.remove('d-none')
            ;(async function readMsgs() {
                let historyRequest = await fetch('/messages')
                let history = await historyRequest.json()
                for (let msg of history) placeMessage(msg)
            })()
        } 
        else {
            let alertText = "User was not found. Consider registering first =)"
            placeAlert('danger', alertText)
        }
    }
    else {
        let alertText = "Either nickname or password was not filled"
        placeAlert('warning', alertText)
    }
    formBtn.innerText = "Login"
}
//TODO logout btn

msgForm.onsubmit = async event => {
    event.preventDefault()
    let { value: newMsg } = msgInp
    msgInp.value = ''
    //TODO hash mb?
    if (newMsg !== '') {
        let msgSentToServer = await fetch('/messages', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
        },
            body: JSON.stringify({ 'name': nickname, 'message': newMsg})
        })
        let reply = await msgSentToServer.json()
        placeMessage(reply)
    }
    
}
