"use strict"

const syntax = {
    'eq': '== ',
    '-eq': '!= ',
    'EQ': '=== ',
    '-EQ': '!== ',
    'mod': '% ',
    'and': '&& ',
    'or': '|| ',

    '>': '> ',
    '<': '< ',
    '>=': '>= ',
    '<=': '<= ',
}

function Validity(statementSeg, input, variables) {
    try
    {
        const command = statementSeg[0].toLowerCase()
        //validate loops
        if(command === '$loop') {

            //if length isn't four, return false
            if(statementSeg.length !== 4) return false
            //If variable that will be looped isn't inside the input, return false
            if(!(statementSeg[1] in input) && !(statementSeg[1] in variables)) return false
            //If variable that 
            if(!Array.isArray(input[statementSeg[1]]) && !Array.isArray(variables[statementSeg[1]])) return false
            
            if(statementSeg[2].toLowerCase() !== 'as') return false


            return true
        }

        if(command === ':else') {
            if(statementSeg.length === 1) {
                return "1 === 1"
            }
            statementSeg.shift()
            statementSeg[0] = '$' + statementSeg[0]
        }

        if(statementSeg[0].toLowerCase() !== '$if') return false


        let script = ''
        let isString = false

        for(let i = 1; i<statementSeg.length; i++) {

            if(statementSeg[i][0] === '"') 
                isString = true

            const valid = syntax[statementSeg[i]]
            if(valid)
                script += valid
            else {
                if(isString)
                    script += statementSeg[i] + ' '
                else {
                    const getVariables = statementSeg[i] in input ? `this.#input["${statementSeg[i]}"] ` : `variables["${statementSeg[i]}"] `
                    script += getVariables
                }
            }

            if(statementSeg[i][statementSeg.length - 1] === '"') 
                isString = false
        }


        return script
    }
    catch(err) {

        console.log(err)
        return false
    }
}


module.exports = Validity