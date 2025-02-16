"use strict"

const path_node = require('path')
const fs = require('fs')

/** 
* @type {object} list of all the variable output tags and their name
*/
const _OUTPUTTAGS_ = {
    '-=': { desc: 'Escape', func: Escape },
    '--': { desc: 'Unescape', func: Unescape },
    '=': { desc: 'Trim', func: (s) => s.trim() },

    '%': { desc: 'Upper Case', func: (s) => s.toUpperCase() },
    '__': { desc: 'Lower Case', func: (s) => s.toLowerCase() },

    '-%': { desc: 'First char upper case', func: FirstCharUpperCase },
}

exports._STATEMENT_ = {
    '+': true,
    '#': true,
    ':': true,
    '/': true,
}

const SYNTAX = {
    'eq': '==',
    '-eq': '!=',
    'EQ': '===',
    '-EQ': '!==',

    //Math
    '+': '+',
    '-': '-',
    '/': '/',
    '*': '*', 
    '%': '%',

    //Logic
    'And': '&&',
    'Or': '||',
    'True': 'true',
    'False': 'false',

    //Also logic
    '>': '>',
    '<': '<',
    '>=': '>=',
    '<=': '<=',
}

const NOTALLOWED = {
    '==': 1,
    '!=': 1,
    '===': 1,
    '!==': 1,
    '&&': 1,
    '||': 1,
    'true': 1,
    'false': 1,
}

const STRINGDELIMITERS = {
    '`': '`',
    '"': '"',
    "'": "'"
}

const escapeTargets = {
    '>': '&gt;',
    '<': '&lt;',

    '&': '&amp;',

    "'": '&#39;',
    '"': '&quot;'
};

const unescapeTargets = {
    '&#60;': '<',
    '&lt;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': "'",
    '&#39;': "'",
    '&#34;': '"',
    '&quot;': '"',
    '&#38;': '&',
    '&amp;': '&'
}



/**
* @param {string} script 
* @returns Function that returns if the script executed inside an if statement is true or not
*/
exports.generateIfStatement = function(script) {
    return new Function('input', `
        try
        {
            if( ${script} )
                return true
            
            return false
        }
        catch(err) {
            console.log(err)
            return err
        }
    `)
}

/**
* @param {string} script 
* @param {object} input 
* @returns translated script
*/
exports.translateScript = function(script, input) {

    let data = []
    let variable = ''

    let isStringLiteral = false
    let stringDelimiter = null
        
    for(const char of script) {
        if(char === STRINGDELIMITERS[char] && !isStringLiteral) {
            isStringLiteral = true

            stringDelimiter = char
        }      
        else if(char === stringDelimiter && isStringLiteral) {
            isStringLiteral = false

            stringDelimiter = null
        }
    
        if(isStringLiteral) continue
    
        if(!char.match(/\s|\(|\)|,|!/gms)) {
            variable += char
    
        } else {
            if(variable in input) {
                data.push({name: variable, variant: 'input', start: i - variable.length, end: i})
            } else if(variable in SYNTAX) {
                data.push({name: variable, variant: variable, start: i - variable.length, end: i})
            } else if(variable in NOTALLOWED) 
                throw new SyntaxError('Invalid if statement syntax')
    
            variable = ''
        }
    }


    if(isStringLiteral) throw new TypeError('string literal is never closed')

    let offset = 0

    for(const d of data) {
        const [ newS, newOffset ] = swap(d, script, offset)

        script = newS
        offset += newOffset 
    }

    return script
}
/**
* @param {object} v 
* @param {string} script  
* @param {string} offset   
*/
function swap(v, script, offset) {
    let add = 0
    /**@type {string} */
    let value = ''

    if(v.variant === 'input') {

        add = 9
        value = `input["${v.name}"]`

    } else {
        add = SYNTAX[v.variant].length - v.variant.length 
        value = SYNTAX[v.variant]
    }

    script = script.slice(0, v.start + offset) + value + script.slice(v.end + offset)

    return [ script, add ]

}

/**
* @param {object} obj object to be traversed 
* @param {string} path the current path
* @param {object} newInput where the paths will be stored 
* @returns object with all the paths
*/
exports.objectPaths = function(obj, path, newInput = {}) {
    if(typeof obj !== 'object' || Array.isArray(obj)) {

        newInput[path] = obj

        return newInput
    }

    const keys = Object.keys(obj)

    for(const key of keys) {
        let result = exports.objectPaths(obj[key], path + '.' + key, newInput)

        if(!result) return false
    }


    return newInput
}
/**
* resolve path
* @param {string} path 
* @param {string[]} arr 
*/
exports.resolveIncludePath = function(path, arr) {

    if(path_node.isAbsolute(path)) {
        arr.push(exports.getDir(path))
    } else  {

        for(const item of arr) {
            if (!fs.existsSync(item+'/'+path)) continue

            path = path_node.resolve(item+'/'+path)

            arr.push(exports.getDir(path))

            break
        }
    }

    return [ path, arr ]
}
/**
* gets the directory of the current path
* @param {string} path 
*/
exports.getDir = function(path) {
    
    for(let i = path.length; i>=0; i--) {
        if(path[i] !== '/' && path[i] !== '\\') continue
    
        return path.slice(0, i)
    }

    return ''
}

exports.ConvertOutPutTag = function(outputTag, v) {
    try
    {
        if(typeof v === 'object')
            v = JSON.stringify(v)

        if(outputTag === '') return v

        const tag = _OUTPUTTAGS_[outputTag]
 

        if(typeof v !== 'string') 
            throw new Error(`${tag.desc} output tag can only be used on strings, "${variable}" is not a string`)


        return _OUTPUTTAGS_[outputTag].func(v)      
    }
    catch(err) {
        console.log(err)
        return false
    }
}



/**
* @param {string} s 
* @returns escaped string 
*/
function Escape(s)  {

    let escaped = ``

    for(let i = 0; i<s.length; i++) 
        escaped += escapeTargets[s[i]] ? escapeTargets[s[i]] : s[i]  


    return escaped
}
/**
* @param {string} s 
* @returns Unescaped string
*/
function Unescape(s) {
    
    let output = ''
    let escapedSeg = ''

    let hasEscapedSeg = false

    for(let i = 0; i<s.length; i++) {
        if(s[i] === '&') {
            if(hasEscapedSeg)
                output += escapedSeg

            hasEscapedSeg = hasEscapedSeg ? false : true         
            
            escapedSeg = ''
        }
            
        if(hasEscapedSeg)
            escapedSeg += s[i]
        else 
            output += s[i] 

        if(s[i] === ';' || i === s.length - 1) {
            hasEscapedSeg = false

            if(unescapeTargets[escapedSeg])
                output += unescapeTargets[escapedSeg]
            else 
                output += escapedSeg

            escapedSeg = ''
        }
    }

    return output
}
/**
* @param {string} s  
*/
function FirstCharUpperCase(s) {
    return s[0].toUpperCase() + s.slice(1, s.length)
}