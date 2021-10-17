require('dotenv').config()
const functions = require("firebase-functions");
const { WebhookClient, Payload, Suggestion } = require('dialogflow-fulfillment');
const cors = require('cors')({ origin: true });
const serviceAccount = require('./service-account.json');
const { SessionsClient } = require('dialogflow');

// Init Sanity client
const sanityClient = require('@sanity/client')
const thisSanityClient = sanityClient({
  projectId: 'vkbgitwu',
  dataset: 'production',
  apiVersion: '2021-09-12',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})


exports.dialogflowGateway = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    const { queryInput, sessionId } = request.body;

    const sessionClient = new SessionsClient({ credentials: serviceAccount });
    const session = sessionClient.sessionPath('lineadelavivienda-axey', sessionId);

    const responses = await sessionClient.detectIntent({ session, queryInput });

    const result = responses[0].queryResult;

    response.send(result);
  });
});

exports.dialogflowWebhook = functions.https.onRequest(async (request, response) => {
  const agent = new WebhookClient({ request, response })
  // Get session ID from session
  const sessionId = request.body.session.match(/sessions\/(.*)$/)[1];
  // Get person by session ID
  let persons = await thisSanityClient.fetch(`*[_type == "person" && whatsappId == "${sessionId}"]`)
  let person
  // Create if it doesn't exist
  if (!(persons.length)) {
    person = await thisSanityClient.create({
      _type: 'person',
      whatsappId: sessionId
    })
  } else {
    person = persons[0]
  }

  async function defaultWelcomeEffectHandler(agent) {
    agent.add("Hola. ¿Te gustaría contar una historia o escuchar la de alguien más?")
  }

  async function tellMyStoryHandler(agent) {
    if (person.givenName) {
      agent.add("Mándame un mensaje de voz con tu historia.")
    } else {
      agent.add(" ") // Added because otherwise setFollowupEvent() fails: https://github.com/dialogflow/dialogflow-fulfillment-nodejs/issues/160
      agent.setFollowupEvent("ldlv_intent_UPDATE_PROFILE")
    }
  }

  async function updateProfileHandler(agent) {
    const parameters = request.body.queryResult.parameters;
    const owner = parameters['owner'] == "Sí" ? true : false
    const consent = parameters['consent'] == "Sí" ? true : false
    const birthDate = new Date(parameters['birthDate']).toISOString().substring(0, 10);
    await thisSanityClient
      .patch(person._id)
      .set({
        givenName: parameters['givenName'],
        lastName: parameters['lastName'],
        birthDate: birthDate,
        city: parameters['location']['city'],
        state: parameters['location']['admin-area'],
        country: parameters['location']['country'],
        owner: owner,
        consent: consent
      })
      .commit()
    agent.add("Gracias por enviar tus datos. Ahora mándame un mensaje de voz.")
  }

  async function getVoiceNoteHandler(agent) {
    // Get voice notes
    const voiceNotes = await thisSanityClient.fetch(`*[_type == 'person'] {stories[]->{...recording{...asset->{url}}}}`)
    // Flatten into array of urls
    let voiceNotesArray = [];
    voiceNotes.forEach(person => {
      if (person.stories) {
        person.stories.forEach(story => {
          if (story.url) {
            voiceNotesArray.push(story.url);
          }
        });
      }
    });
    const voiceNoteUrl = voiceNotesArray[Math.floor(Math.random() * voiceNotesArray.length)]
    agent.add("Va un una historia.")
    agent.add(new Payload('PLATFORM_UNSPECIFIED', {
      voiceNoteUrl: voiceNoteUrl
    }));
  }


  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', defaultWelcomeEffectHandler);
  intentMap.set('Tell my story', tellMyStoryHandler);
  intentMap.set('Update Profile', updateProfileHandler);
  intentMap.set('Get Voice Note', getVoiceNoteHandler);
  agent.handleRequest(intentMap);
});