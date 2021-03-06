Feature: Syntax Highlighting for Scenario Outlines and Examples

Scenario Outline: name: <name> and country: <country>
    avoid empty cells and use null in 'Examples' to work better with karate (or use type hints, see below)
        and also consider stuffing whole chunks of json into cells

    Examples:
        | name   | country   | active | limit | expected                                                                         |
        | "test" | 'IN'      | true   |     1 | { name: '#notnull', country: '#notnull', active: '#notnull', limit: '#notnull' } |
        | 'bar'  | null      | null   |     5 | { name: '#notnull', limit: '#notnull' }                                          |
        | 'baz'  | 'JP'      | null   |  null | { name: '#notnull', country: '#notnull' }                                        |
        | null   | 'US'      | null   |     3 | { country: '#notnull', limit: '#notnull' }                                       |
        | null   | null      | false  |  null | { active: '#notnull' }                                                           |

Scenario Outline: name: <name> and country: <country>
    above example simplified / improved using type-hints and karate's enhancements to example row handling

    Examples:
        | name | country | active! | limit! | expected!                                                                       |
        | foo  | IN      | true    |      1 | { name: '#notnull', country: '#notnull', active: '#notnull', limit: '#notnull' } |
        | bar  |         |         |      5 | { name: '#notnull', limit: '#notnull' }                                          |
        | baz  | JP      |         |        | { name: '#notnull', country: '#notnull' }                                        |
        |      | US      |         |      3 | { country: '#notnull', limit: '#notnull' }                                       |
        |      |         | false   |        | { active: '#notnull' }                                                           |
        

Scenario Outline: expressions - index: <index> and country: <country>
    combine 'Examples' embedded expressions and karate expression evaluation

    Examples:
        | name         | country   | active | limit | index |
        | names.first  | 'IN'      | true   |     1 | 0     |
        | names.second | null      | null   |     5 | 1     |
        | names.third  | 'JP'      | null   |  null | 2     |
        | names.fourth | 'US'      | null   |     3 | 3     |
        | names.fifth  | null      | false  |  null | 4     |
        
Scenario Outline: expressions - index: <index> and country: <country>
    the above outline re-written to use karate's enhanced row-handling

    # if you really wanted an empty or blank string as row-data, just use type-hints combined with single or double strings
    Examples:
        | name         | country! | active! | limit! |
        | names.first  | 'IN'     | true    |      1 |
        | names.second |          |         |      5 |
        | names.third  | "JP"     |         |        |
        | names.fourth | 'US'     |         |      3 |
        | names.fifth  | ''       | false   |        |
 
Scenario Outline: test with xml 

    Examples:
        | name         | data!                                      |
        | names.fifth  | <xml><aTag attrib="test"></aTag></xml>     |
 
Scenario Outline: a function as example

    Examples:
        | kitten              | 
        | read('kittens.csv') | 
 