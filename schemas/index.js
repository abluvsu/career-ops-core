"use strict";

const engine = require("../templates/engine.js");

module.exports = {
  configSchema: engine.configSchema,
  ExperienceTypeEnum: engine.ExperienceTypeEnum,
  ExperienceItemSchema: engine.ExperienceItemSchema,
  ProjectItemSchema: engine.ProjectItemSchema,
  validateConfig: engine.validateConfig
};
