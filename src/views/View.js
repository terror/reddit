const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const Url = require('../helpers/Url');

class View {
  constructor(templateDirectory) {
    this.templateDirectory = templateDirectory;

    handlebars.registerHelper('base', () => Url.base());
    handlebars.registerHelper('path', (relativePath, parameters) =>
      Url.path(relativePath, parameters)
    );
    handlebars.registerHelper('styles', (relativePath) =>
      Url.styles(relativePath)
    );
    handlebars.registerHelper('scripts', (relativePath) =>
      Url.scripts(relativePath)
    );
    handlebars.registerHelper('images', (relativePath) =>
      Url.images(relativePath)
    );
    handlebars.registerHelper('isEqual', function (a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  static async initialize(
    templatePath,
    templateData = {},
    templateDirectory = 'src/views'
  ) {
    const view = new View(templateDirectory);

    await view.loadTemplates();
    await view.setTemplate(templatePath);
    view.setTemplateData(templateData);

    return view;
  }

  async getAllFiles(directory, arrayOfFiles = []) {
    const files = await fs.readdir(directory);

    for (let i = 0; i < files.length; i++) {
      if ((await fs.stat(`${directory}/${files[i]}`)).isDirectory()) {
        arrayOfFiles = await this.getAllFiles(
          `${directory}/${files[i]}`,
          arrayOfFiles
        );
      } else {
        arrayOfFiles.push(path.join(directory, '/', files[i]));
      }
    }

    return arrayOfFiles;
  }

  async compileTemplate(templateFileName, templateDirectory = '.') {
    const filename = `${templateDirectory}/${templateFileName}`;
    const template = (await fs.readFile(filename)).toString();

    return handlebars.compile(template);
  }

  /**
   * Registers all templates as partials so that we can nest any template
   * inside of any other template.
   */
  async loadTemplates() {
    const allFiles = await this.getAllFiles(this.templateDirectory);
    const templateFiles = allFiles.filter(
      (file) => file.split('.')[1] === 'hbs'
    );

    for (let i = 0; i < templateFiles.length; i++) {
      const filePath = templateFiles[i].split('/').slice(0, -1).join('/');
      const fileName = templateFiles[i].split('/').slice(-1)[0];
      const templateName = templateFiles[i]
        .split(this.templateDirectory)[1]
        .split('.')[0]
        .slice(1);
      const compiledTemplate = await this.compileTemplate(fileName, filePath);

      handlebars.registerPartial(templateName, compiledTemplate);
    }
  }

  async setTemplate(templateName) {
    this.template = await this.compileTemplate(
      `${this.templateDirectory}/${templateName}.hbs`
    );
  }

  setTemplateData(templateData) {
    this.data = templateData;
  }

  render() {
    return this.template(this.data);
  }
}

module.exports = View;
