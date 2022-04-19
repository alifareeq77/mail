document.addEventListener('DOMContentLoaded', function () {

    let username = document.querySelector('#user').innerHTML;
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', () => compose_email('', '', false));

    load_mailbox('inbox');
    return false;
});

function compose_email(init_send,init_date,init_body, redirect) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#show-email').style.display = 'none'
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
//check if redirected from replay
    if (redirect) {

        recipients.value = `${init_send}`;
        subject.value = 'Re: ' + init_send;
        body.value=`On ${init_date} ${init_send} wrote: ${init_body}`

    }

    // functionality for submit button
    document.querySelector('#compose-form').onsubmit = (e) => {
        e.preventDefault();
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
                //stop the default behaviour
                e.preventDefault();
            });
        //redirect user to sent box
        load_mailbox('sent');
    }


    // Clear out composition fields
    if (!redirect) {

        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    }
    //end of compose function
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.getElementById('show-email').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    //get current user
    let username = document.querySelector('#user').innerHTML;

    //check if it's read
    function check(read) {
        if (read) {
            return 'white';
        } else {
            return '#c3c3c3';
        }
    }

    //show email function
    function show_email(email_id, mailbox) {
        fetch(`emails/${email_id}`).then(response => response.json()).then(
            email => {
                //check archive state
                function is_archived(email_archive) {
                    if (!email_archive) {
                        return 'archive'
                    } else {
                        return ' unarchive email'
                    }
                }

                function add_sent(mailbox) {
                    if (mailbox.toLowerCase() === 'inbox' || mailbox.toLowerCase === 'archived') {
                        return '<button class="btn btn-dark" id="replay">replay</button>';
                    } else {
                        return '';
                    }
                }

                //clear the area
                document.querySelector('#emails-view').style.display = 'none';
                document.querySelector('#compose-view').style.display = 'none';
                document.querySelector('#show-email').style.display = 'block';
                //make email read
                fetch(`/emails/${email.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: true,
                    })
                }).then(() => {
                    console.log(email.read)
                })
                // make the email details visible
                let view = document.getElementById('show-email');
                view.innerHTML = `
                <h2>Sender : ${email.sender}</h2>
                <div class="p-3 border bg-light" style="font-size: 14pt;padding: 10px">
                <h4 style="">Subject :${email.subject}</h4>
                <div style="color: grey;font-size: 12pt">Date : ${email.timestamp}</div>
                <div>Recipients : ${email.recipients}<br/></div>
                <p style="padding-top:50px ">Descrption:<br/>${email.body}</p>
                <button id="archive" class="btn btn-secondary">${is_archived(email.archived)}</button>
                ${add_sent(mailbox)}
                  </div>`;
                // archive button func
                document.getElementById('archive').addEventListener('click', () => {
                    fetch(`/emails/${email.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            archived: !email.archived
                        })
                    }).then(() => {
                        window.alert(`${email.subject} moved to ${email.archived ? 'inbox' : 'archive'}`)
                        document.location.reload();
                    })
                });
                //replay button func
                document.getElementById('replay').addEventListener('click', () => {
                    compose_email(email.sender,email.timestamp,email.body, true)
                })
            }
        );
    }

    fetch(`/emails/${mailbox}`, {method: 'GET'})
        .then(response => response.json())
        .then(emails => {

            emails.forEach((e) => {
                    //mail dict
                    let mail = e;
                    if (mailbox.toLowerCase() === 'sent' && mail.sender === username) {
                        document.querySelector("#emails-view").innerHTML +=
                            `<div class="emails-button" style="text-decoration: none">
                    <div style="padding: 10px;display: flex;align-items: baseline;justify-content: space-between;border:1px black solid;align-content: space-between; background: ${check(mail.read)} " >
                        <div style="font-weight: bold">${mail.recipients}</div>
                        <div>${mail.subject}</div>
                        <div>${mail.timestamp}</div>
                    </div>
                </div>`;
                        //add listener to the div to see if clicked
                        document.querySelector('.emails-button').addEventListener('click', () => {
                            show_email(mail.id, mailbox)
                        });
                        document.querySelector('.emails-button').addEventListener('mouseover', (div) => {
                            div.target.style.cursor = 'pointer'
                        })
                    } else {
                        e['recipients'].forEach((rec) => {
                            // check if inbox or archive
                            if (rec === username) {
                                document.querySelector("#emails-view").innerHTML +=
                                    `<div class="emails-button" style="text-decoration: none">
                    <div style="padding: 10px;display: flex;align-items: baseline;justify-content: space-between;border:1px black solid;align-content: space-between; background: ${check(mail.read)} " >
                        <div style="font-weight: bold">${mail.sender}</div>
                        <div>${mail.subject}</div>
                        <div>${mail.timestamp}</div>
                    </div>
                </div>`;
                                //add listener to the div to see if clicked
                                document.querySelector('.emails-button').addEventListener('click', () => {
                                    show_email(mail.id, mailbox);

                                });
                                document.querySelector('.emails-button').addEventListener('mouseover', (div) => {
                                    div.target.style.cursor = 'pointer'
                                })

                            }
                        })

                    }
                }
            )
        });


}