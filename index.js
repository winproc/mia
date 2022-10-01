const discord = require("discord.js")
const express = require("express")
const fs = require('fs');
const TOKEN = process.env['token']

const server = express()
const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds] });

function redReply(authorname, title, message) {
  return new discord.EmbedBuilder()
    .setColor(0xFF0000)
    .setAuthor({name: authorname})
    .setTitle(title)
    .setDescription(message)
    .setThumbnail("https://i.ibb.co/qjbWJN7/MVD-Ministry-of-Internal-Affairs-Logo.png")
}

function validateUserFromInteraction(interaction) {
  if ((interaction.user.id == "716656214280241402") || (interaction.user.id == "514842671832104960") || (interaction.user.id == "484958522556153878") || (interaction.user.id == "1001152718599094292")) {
    return true
  } else {
    return false
  }
}

function getMedalLog() {
  var readData = fs.readFileSync("medals.json", "utf-8")
  if (readData != "") {
    return JSON.parse(readData);
  }
  
}

function addMedalLog(name) {
  var content = getMedalLog()
  content.push(name)
  content = JSON.stringify(content)
  
  var status = true
  try {
    fs.writeFileSync("medals.json", content)
  } catch(err) {
    status = false
  }
  
  return status
}

function removeMedalLog(name) {
  var content = getMedalLog()
  var index = content.indexOf(name)
  
  if (index > -1) {
    content.splice(index, 1)
    content = JSON.stringify(content)
    try {
      fs.writeFileSync("medals.json", content)
    } catch (err) {
      console.log(err)
      return "Something went wrong while updating the database!"
    }
    return "Medal was successfully removed!"
  } else {
    return "Unable to find the medal in the log."
  }
}

function getMedalsForUser(username) {
  try {
    var content = fs.readFileSync("playermedals.json", "utf-8")
    var parsedContent = JSON.parse(content)
    if (!(username in parsedContent)) {
      return "No medals found for user named " + username + "!"
    } else {
      return parsedContent[username]
    }
  } catch (err) {
    console.log(err)
    return "Something went wrong while running the command!"
  }
}

function getPlayerMedalLog() {
  try {
    var content = fs.readFileSync("playermedals.json", "utf-8")
    return JSON.parse(content)
  } catch (err) {
    console.log(err)
    return false
  }
}

function viewMedalsHandler(func) {
  if (typeof(func) == "string") {
    return func
  } else {
    return func.join('\n• ')
  }
}

function addMedalToUser(username, medalname) {
  var medals = getPlayerMedalLog()
  var metadata_medals = getMedalLog()
  
  if (metadata_medals.indexOf(medalname) > -1){
    if (username in medals) {
      medals[username].push(medalname)
    } else {
      medals[username] = [medalname]
    }

    try {
      fs.writeFileSync("playermedals.json", JSON.stringify(medals))
      return "Successfully added the medal to the player!"
    } catch (err) {
      console.log(err)
      return "Failure while saving the medal to the database!"
    }
    
  } else {
    return "No such medal named " + medalname + " was found in the database!"
  }
}

function removeMedalOfUser(username, medalname) {
  var medals = getPlayerMedalLog()
  if (username in medals) {
    var found = medals[username].indexOf(medalname)
    if (found > -1) {
      medals[username].splice(found, 1)
      try {
        fs.writeFileSync("playermedals.json", JSON.stringify(medals))
        return "Successfully removed the medal of the user!"
      } catch (err) {
        console.log(err)
        return "Something went wrong while updating database!"
      }
    } else {
      return "The user does not have such a medal!"
    }
  } else {
    return "The user does not have any medals!"
  }
}

server.get('/', function (req, res) {
  res.send('MIA Bot Server')
})


const commands = [
  new discord.SlashCommandBuilder()
  .setName("create-medal")
  .setDescription("Create a new medal")
  .addStringOption(option => 
    option.setName("name")
    .setDescription("Name of the medal")
    .setRequired(true)),
  
  new discord.SlashCommandBuilder()
  .setName("delete-medal")
  .setDescription("Delete a medal")
  .addStringOption(option => 
    option.setName("name")
    .setDescription("Name of the medal to delete")
    .setRequired(true)),
  
  new discord.SlashCommandBuilder()
  .setName("view-medals")
  .setDescription("View all your medals")
  .addUserOption(option => 
    option.setName("player")
    .setDescription("Name of the player you want to query")
    .setRequired(false)),
  
  new discord.SlashCommandBuilder()
  .setName("add-medal")
  .setDescription("Add a medal to a player")
  .addUserOption(option => 
    option.setName("player")
    .setDescription("The player you want to give the medal to")
    .setRequired(true))
  .addStringOption(option => 
    option.setName("medal")
    .setDescription("Name of the medal")
    .setAutocomplete(true)
    .setRequired(true)),
  new discord.SlashCommandBuilder()
  .setName("remove-medal")
  .setDescription("Remove the medal of a player")
  .addUserOption(option => 
    option.setName("player")
    .setDescription("The player you want to remove the medal of")
    .setRequired(true))
  .addStringOption(option => 
    option.setName("medal")
    .setDescription("Name of the medal to remove")
    .setAutocomplete(true)
    .setRequired(true)),
  new discord.SlashCommandBuilder()
  .setName("medal-list")
  .setDescription("Get the list of created medals")

].map(command => command.toJSON())

client.once("ready", () => {
  console.log("Ready");
})

const rest = new discord.REST({ version: '10' }).setToken(TOKEN);
rest.put(discord.Routes.applicationCommands("1023166888664109097"), {body: commands})

client.on("interactionCreate", async interaction => {

  if (interaction.isAutocomplete()) {
    if ((interaction.commandName == "add-medal") || (interaction.commandName == "remove-medal")) {
      var choices = getMedalLog()
      var filteredChoices = choices.filter(choice => choice.startsWith(interaction.options.getFocused()))
      await interaction.respond(
        filteredChoices.map(choice => ({ name: choice, value: choice }))
      )
    }
  }
  
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName == "create-medal") {
    if (validateUserFromInteraction(interaction)) {
      if (addMedalLog(interaction.options.getString("name"))) {
        await interaction.reply({embeds: [redReply("Ministry of Internal Affairs", "Medal System | Create Medal","Medal was successfully created!")]})
      } else {
        await interaction.reply("Something went wrong while updating the database!")
      }
      
    }
  } else if (interaction.commandName == "delete-medal") {
    if (validateUserFromInteraction(interaction)) {
      await interaction.reply({embeds: [redReply("Ministry of Internal Affairs", "Medal System | Delete Medal",removeMedalLog(interaction.options.getString("name")))]})
    }
  } else if (interaction.commandName == "view-medals") {
    
    var user = interaction.options.getUser("player") || interaction.user
    var maincontent = `${user} has the following medals:\n\n• `
    var content = viewMedalsHandler(getMedalsForUser(user.username))
    
    if (content == "") {
      maincontent = "No medals found!"
    } else {
      maincontent += content
    }
    await interaction.reply({embeds: [redReply("Ministry of Internal Affairs", "Medal System | View Medals", maincontent)]})
  } else if (interaction.commandName == "add-medal") {
    await interaction.reply({ embeds: [redReply("Ministry of Internal Affairs", "Medal System | Add Medal", addMedalToUser(interaction.options.getUser("player").username,interaction.options.getString("medal")))]})
    
  } else if (interaction.commandName == "remove-medal") {
    await interaction.reply({ embeds: [redReply("Ministry of Internal Affairs", "Medal System | Remove Medal", removeMedalOfUser(interaction.options.getUser("player").username,interaction.options.getString("medal")))]})
  } else if (interaction.commandName == "medal-list") {
    var medal_list_json = getMedalLog()
    await interaction.reply({embeds: [redReply("Ministry of Internal Affairs", "Medal System | Medal List", viewMedalsHandler(medal_list_json))]})
  }
          
})

client.on('debug', console.log)

async function login() {
  
  await client.login(TOKEN)
  console.log("done")
}

login()

server.listen(8080)
