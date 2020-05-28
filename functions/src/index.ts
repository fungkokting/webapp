import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as firebaseHelper from 'firebase-functions-helper/dist';
import * as express from 'express';
import * as bodyParser from "body-parser";
import * as nodemailer from "nodemailer";


admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

const app = express();
const main = express();

main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));
main.use('/api/v1', app);

const contactsCollection = 'contacts';

export const webApi = functions.https.onRequest(main);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'app.beijinglanguage@gmail.com',
        pass: 'Bj2016!@#'
    }
});

//const mailOptions = {
  //  from: `app.beijinglanguage@gmail.com`,
    //to: student.EMAIL,
    //subject: 'Here is code for registration',
    //html: `<h1>Here is the code:</h1>
    // <p> <b>1234</b></p>`
//};


interface Contact {
    firstName: String
    lastName: String
    email: String
}

// return student information
app.post('/registerapp', async (req, res) => {
        let msg= '';
    try {
        const student = req.body['STUDENT'];
	let token = Math.floor(100000 + Math.random() * 900000);
               
	const mailOptions = {
    		from: `app.beijinglanguage@gmail.com`,
    		to: student.EMAIL,
    		subject: 'Here is code for registration',
    		html: `<h1>Here is the code:</h1>
     		<p> <b>${token}</b></p>`
	};
        
	const query =[['EMAIL', '==',student.EMAIL]];
        
        let exist = await firebaseHelper.firestore.queryData(db, 'STUDENTS', query);
        
        if(exist == 'No such document!'){
                //const newDoc = await firebaseHelper.firestore
                //.createNewDocument(db, 'INVOICES', invoice);
                res.status(200).send(`Student not found`);
        }else{
		//let token = Math.floor(100000 + Math.random() * 900000);
		let code = { EMAIL:student.EMAIL,CODE: token};
		await firebaseHelper.firestore.createNewDocument(db,'REGISTERCODE',code);
		//send email
   		transporter.sendMail(mailOptions, (error, data) => {
 		if (error) {
			res.status(200).send('Error : ' + error.toString());
    		}else{
    			res.status(200).send('Sent!');
		}
		
		});
        }
        //res.status(200).send(msg);
    } catch (error) {
        res.status(400).send(`Student not valid format!!!${error.message} ${msg}`)
    }
})

// return student information
app.post('/getstudent', async (req, res) => {
        let msg= '';
    try {
        const student = req.body['STUDENT'];

        //for(let invoice of invoices){
        const query =[['EMAIL', '==',student.EMAIL]];
        //msg+=query;
        let exist = await firebaseHelper.firestore.queryData(db, 'STUDENTS', query);
        //msg += `${exist}\n`;
        if(exist == 'No such document!'){
                //const newDoc = await firebaseHelper.firestore
                //.createNewDocument(db, 'INVOICES', invoice);
                msg = `Student not found`;
        }else{
                msg = JSON.stringify(exist);
        }
        res.status(200).send(msg);
    } catch (error) {
        res.status(400).send(`Student not valid format!!!${error.message} ${msg}`)
    }
})

// Add new notices
app.post('/addnotices', async (req, res) => {
        let msg= '';
    try {
        const notices = req.body['NOTICES'];

        for(let notice of notices){
        const query =[['NOTICEID', '==',notice.NOTICEID]];
        //msg+=query;
        let exist = await firebaseHelper.firestore.queryData(db, 'NOTICES', query);
        msg += `${exist}\n`;
        if(exist == 'No such document!'){
                const newDoc = await firebaseHelper.firestore
                .createNewDocument(db, 'NOTICES', notice);
                msg += `Created a new notices: ${notice.NOTICEID} with id ${newDoc.id}\n`;

        }else{
                msg += `Duplicate found,Skip notice ${notice.NOTICEID} ${query}\n`;
        }}
        res.status(200).send(msg);
    } catch (error) {
        res.status(400).send(`Notices not valid format!!!${error.message} ${msg}`)
    }
})

// Add new students
app.post('/addstudents', async (req, res) => {
        let msg= '';
    try {
        const students = req.body['STUDENTS'];

        for(let student of students){
        const query =[['ID', '==',student.ID]];
        //msg+=query;
        let exist = await firebaseHelper.firestore.queryData(db, 'STUDENTS', query);
        msg += `${exist}\n`;
        if(exist == 'No such document!'){
                const newDoc = await firebaseHelper.firestore
                .createNewDocument(db, 'STUDENTS', student);
                msg += `Created a new students: ${student.ID} with id ${newDoc.id}\n`;

        }else{
                msg += `Duplicate found,Skip student ${student.ID} ${query}\n`;
        }}
        res.status(200).send(msg);
    } catch (error) {
        res.status(400).send(`Students not valid format!!!${error.message} ${msg}`)
    }
})

// Add new invoices
app.post('/addinvoices', async (req, res) => {
	let msg= '';
    try {
        const invoices = req.body['INVOICES'];
	
	for(let invoice of invoices){
	const query =[['INVOICENO', '==',invoice.INVOICENO]];
	//msg+=query;
	let exist = await firebaseHelper.firestore.queryData(db, 'INVOICES', query);
	msg += `${exist}\n`;
        if(exist == 'No such document!'){
        	const newDoc = await firebaseHelper.firestore
            	.createNewDocument(db, 'INVOICES', invoice);
        	msg += `Created a new invoices: ${invoice.INVOICENO} with id ${newDoc.id}\n`;
		
	}else{
		msg += `Duplicate found,Skip invoice ${invoice.INVOICENO} ${query}\n`;
	}}
	res.status(200).send(msg);
    } catch (error) {
        res.status(400).send(`Invoices not valid format!!!${error.message} ${msg}`)
    }
})


// Add new contact
app.post('/contacts', async (req, res) => {
    try {
        const contact: Contact = {
            firstName: req.body['firstName'],
            lastName: req.body['lastName'],
            email: req.body['email']
        }

        const newDoc = await firebaseHelper.firestore
            .createNewDocument(db, contactsCollection, contact);
        res.status(201).send(`Created a new contact: ${newDoc.id}`);
    } catch (error) {
        res.status(400).send(`Contact should only contains firstName, lastName and email!!!`)
    }        
})

// Update new contact
app.patch('/contacts/:contactId', async (req, res) => {
    const updatedDoc = await firebaseHelper.firestore
        .updateDocument(db, contactsCollection, req.params.contactId, req.body);
    res.status(204).send(`Update a new contact: ${updatedDoc}`);
})

// View a contact
app.get('/contacts/:contactId', (req, res) => {
    firebaseHelper.firestore
        .getDocument(db, contactsCollection, req.params.contactId)
        .then(doc => res.status(200).send(doc))
        .catch(error => res.status(400).send(`Cannot get contact: ${error}`));
})

// View all contacts
app.get('/contacts', (req, res) => {
    firebaseHelper.firestore
        .backup(db, contactsCollection)
        .then(data => res.status(200).send(data))
        .catch(error => res.status(400).send(`Cannot get contacts: ${error}`));
})

// Delete a contact 
app.delete('/contacts/:contactId', async (req, res) => {
    const deletedContact = await firebaseHelper.firestore
        .deleteDocument(db, contactsCollection, req.params.contactId);
    res.status(204).send(`Contact is deleted: ${deletedContact}`);
})

export { app };
