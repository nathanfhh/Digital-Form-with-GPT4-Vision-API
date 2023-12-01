// Copied from https://github.com/lljj-x/vue-json-schema-form/blob/master/packages/lib/utils/schema/validate.js
import Ajv from 'ajv';

export function createAjvInstance() {
    const ajvInstance = new Ajv({
        errorDataPath: 'property',
        allErrors: true,
        multipleOfPrecision: 8,
        schemaId: 'auto',
        unknownFormats: 'ignore',
    });

    // 添加base-64 format
    ajvInstance.addFormat(
        'data-url',
        /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/
    );

    // 添加color format
    ajvInstance.addFormat(
        'color',
        // eslint-disable-next-line max-len
        /^(#?([0-9A-Fa-f]{3,4}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgba?|hsla?)\(.*\))$/
    );
    return ajvInstance;
}
