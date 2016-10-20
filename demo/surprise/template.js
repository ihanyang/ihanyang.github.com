const template = function(selector, data) {
	const element = document.querySelector(selector),
		compile = (tpl, data) => {
			const reg = new RegExp(`${template.config.openTag}([^${template.config.closeTag}]+)?${template.config.closeTag}`, "g")
			//regOut = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
			const nameArray = []

			let code = "let result = [];\n\n",
				codeStart = "",
				cursor = 0,
				match

			const add = (expression, isExpression) => {
				if (isExpression) {
					expression = expression.trim()

					if (/^each/.test(expression)) {
						const [, name, value, index] = expression.split(" ")

						if (! nameArray.includes(name)) {
							codeStart += `let ${name} = ${JSON.stringify(data[name])};\n`

							nameArray.push(name)
						}

						if (! value) {
							value = "$value"
						}

						if (! index) {
							index = "$index"
						}

						if (Array.isArray(data[name])) {
							code += `\nfor (var ${index} = 0; ${index} < ${name}.length; ${index}++) {\n`
							code += `let ${value} = ${name}[${index}];\n`
						} else {
							template.tmp.object = {
								key: index
							}

							code += `let ${index} = 0;\n`
							code += `for (let key in ${name}) {\n`
							code += `let ${value} = ${name}[key];\n`
						}

						return
					}

					if (/^\/each/.test(expression)) {
						if (template.tmp.object) {
							code += `${template.tmp.object.key}++;\n`
						}

						code += "};\n\n"

						return
					}

					if (/^if/.test(expression)) {
						const [, name] = expression.split(" ")

						if (! nameArray.includes(name)) {
							if (typeof data[name] === "string") {
								codeStart += `let ${name} = '${data[name]}';\n`

								nameArray.push(name)
							} else {
								codeStart += `let ${name} = ${data[name]};\n`

								nameArray.push(name)
							}

							nameArray.push(name)
						}

						code += `\nif (${expression.split(" ")[1]}) {\n`

						return
					}

					if (/^\/if/.test(expression)) {
						code += "};\n\n"

						return
					}

					if (/^#/.test(expression)) {
						const name = expression.slice(1)

						if (! nameArray.includes(name)) {
							codeStart += `let ${name} = '${data[name]}';\n`

							nameArray.push(name)
						}

						code += `let ${expression}Replace = ${expression}.replace(/[<>]/g, (match) => {
			        			if (match === "<") {
			        				return "&lt;"
			        			}

			        			if (match === ">") {
			        				return "&gt;"
			        			}
			        		});\n`

						code += "result.push(" + name + "Replace);\n"

						return
					}

					if (expression.match(/\|/)) {
						let [name, filter] = expression.split("|")

						name = name.trim()

						if (! nameArray.includes(name)) {
							codeStart += `let ${name} = ${data[name]};\n`

							nameArray.push(name)
						}

						const [filterFunc, ...argv] = filter.trim().split(" ")

						expression = template.filters[filterFunc](data[name], ...argv)

						code += "result.push('" + expression + "');\n"

						return
					}

					if (data[expression] !== undefined) {
						const name = expression

						if (! nameArray.includes(name)) {
							if (typeof data[name] === "string") {
								codeStart += `let ${name} = '${data[name]}';\n`

								nameArray.push(name)
							} else {
								codeStart += `let ${name} = ${data[name]};\n`

								nameArray.push(name)
							}
						}
					}

					code += "result.push(" + expression + ");\n"

				} else {
					if (expression != "") {
						code += 'result.push("' + expression + '");\n'
					}
				}

				return add
			}

			tpl = tpl.replace(/[\r\t\n]/g, "")

			while (match = reg.exec(tpl)) {
				add(tpl.slice(cursor, match.index))
				add(match[1], true)

				cursor = reg.lastIndex
			}

			add(tpl.slice(cursor))

			code = codeStart + code

			code += "return result.join('')"

			console.log(code)
			return new Function(code.replace(/[\r\t\n]/g, "")).apply(null, data)
		}

	let html = ""

	if (element) {
		html = /^(textarea|input)$/i.test(element.nodeName) ? element.value : element.innerHTML

		return compile(html, data)
	}

	return compile(html, data)
}

template.config = (name, value) => {
	template.config[name] = value
}

template.tmp = {}
template.filters = {}

template.filter = (name, cb) => {
	template.filters[name] = cb
}