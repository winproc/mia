const discord = require("discord.js")
const express = require("express")
const fs = require('fs');
const TOKEN = process.env['token']

const server = express()
const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds] });

function validateUserFromInteraction(interaction) {
  if (interaction.user.id == "716656214280241402") {
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
    return "Successfully removed the medal!"
  } else {
    return "Unable to find the medal in the log."
  }
}

function getMedalsForUser(username) {
  try {
    var content = fs.readFileSync("playermedals.json", "utf-8")
    var parsedContent = JSON.parse(content)
    if (!(username in parsedContent)) {
      return "No such user named " + username
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
    return func.join()
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
    } catch (err) {
      console.log(err)
      return "Failure while saving the medal to the database!"
    }
    return "Successfully added a medal to the user!"
  }
}

function removeMedalOfUser(username) {
  
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
  .setDescription("View all your medals"),
  
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
    .setRequired(true))

].map(command => command.toJSON())

client.once("ready", () => {
  console.log("Ready");
})

const rest = new discord.REST({ version: '10' }).setToken(TOKEN);
rest.put(discord.Routes.applicationCommands("1023166888664109097"), {body: commands})

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName == "create-medal") {
    if (validateUserFromInteraction(interaction)) {
      if (addMedalLog(interaction.options.getString("name"))) {
        await interaction.reply("Saved medal!")
      } else {
        await interaction.reply("Something went wrong while updating the database!")
      }
      
    }
  } else if (interaction.commandName == "delete-medal") {
    if (validateUserFromInteraction(interaction)) {
      await interaction.reply(removeMedalLog(interaction.options.getString("name")))
    }
  } else if (interaction.commandName == "view-medals") {
    await interaction.reply(viewMedalsHandler(getMedalsForUser(interaction.user.username)))
  } else if (interaction.commandName == "add-medal") {
    await interaction.reply(addMedalToUser(interaction.options.getUser("player").username,interaction.options.getString("medal")))
  }
          
})

try {
  client.login(TOKEN)
} catch(err) {
  throw err
}
