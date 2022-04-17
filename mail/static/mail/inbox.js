document.addEventListener('DOMContentLoaded', function () {

    let username = document.querySelector('#user').innerHTML;
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // get all values and buttons for compose
    let recipients = document.getElementById("compose-recipients");
    let subject = document.getElementById('compose-subject');
    let body = document.getElementById('compose-body');
    let submit_button = document.getElementById('submit-it');

    //set submit button to disabled by default
    submit_button.disabled = true;

    //check if the form is ready to submit
    [body, recipients, subject].forEach((element) => {
        element.addEventListener('input', () => {
            submit_button.disabled = !(recipients.value.length > 0 && subject.value.length > 0 && body.value.length > 0);
        })
    });

    // functionality for submit button
    submit_button.addEventListener('click', () => {
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients.value,
                subject: subject.value,
                body: body.value,
            })
        })
            .then(response => response.json())
            .then(result => {
                // Print result
                console.log(result);
            });
        //redirect user to sent box
        load_mailbox('sent');
        return false;
    })


    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    //stop the default behaviour
    return false;
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    //get current user
    let username = document.querySelector('#user').innerHTML;

    //check if it's read
    function check(read) {
        if (read) {
            return 'white'
        } else {
            return '#c3c3c3'
        }
    }

    //if the mailbox is inbox show only inbox
    if (mailbox === 'inbox') {
        fetch('/emails/inbox')
            .then(response => response.json())
            .then(emails => {
                emails.forEach((e) => {
                    //mail dict
                    let mail = e;
                    e['recipients'].forEach((rec) => {

                        if (rec === username && !mail.read) {
                            console.log(mail.read)

                            document.querySelector("#emails-view").innerHTML +=
                `<a style="text-decoration: none">
                    <div style="padding: 10px;display: flex;align-items: baseline;justify-content: space-between;border:1px black solid;align-content: space-between; background: ${check(mail.read)} " >
                        <div style="font-weight: bold">${mail.sender}</div>
                        <div>${mail.subject}</div>
                        <div>${mail.timestamp}</div>
                    </div>
                </a>`
                            }

                    })
                })
            });
    }
}