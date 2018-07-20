import { ActionManager, Action, ContextDataSource, SearchResult } from "../Model";

export class ActionManagerImpl implements ActionManager {


    public flatActions: Action[] = [];

    constructor(private rootAction: Action, private dataSource: ContextDataSource) {
        this.buildFlatActions();
    }

    private buildFlatActions(): any {
        const deepSearch = (action: Action): Action[] => {

            let childActions: Action[] = [];

            if (action.leafs) {
                action.leafs.forEach(leaf => {
                    const result = deepSearch(leaf);
                    if (result.length > 0) {
                        result.forEach(r => { childActions.push(r) });
                    }
                });
            }

            if (childActions.length > 0) {
                childActions = childActions.map(child => {
                    return {
                        name: action.name.concat(".").concat(child.name).toLowerCase(),
                        execute: (context: any) => {
                            const childContext = child.execute ? child.execute(context) : context;
                            return action.execute(childContext);
                        },
                        matchesContext: child.matchesContext
                    }
                })
            } else {
                childActions.push(action)
            }

            return childActions
        }

        this.flatActions = [];
        this.rootAction.leafs.forEach(leaf => {
            this.flatActions = [...this.flatActions, ...deepSearch(leaf)];
        })
    }

    public findActionsMatchingPhrase(phrase: string): Action[] {
        const coverPhrase = (coveringString: string, phrase: string): [string, boolean] => {
            let difference = phrase;
            for (let i = 0; i < coveringString.length; i++) {
                difference = difference.replace(coveringString[i], "")
            }
            return [difference, difference.length < phrase.length];
        }
        const hitByPhrase = (phrase: string, a: Action): SearchResult => {
            const parts = a.name.split(".")

            let hitCount = 0;
            let phraseCovered = phrase;
            parts.forEach(namePart => {

                let beginIndex = 0;
                let currentIndex = 0;

                while (beginIndex + currentIndex < phrase.length) {
                    const testPhrase = phrase.substr(beginIndex, ++currentIndex);
                    if (namePart.toLocaleLowerCase().indexOf(testPhrase) != -1) {
                        const [newCoveredPhrase, coverOccured] = coverPhrase(testPhrase, phraseCovered);
                        if (coverOccured) {
                            hitCount++
                        }
                        phraseCovered = newCoveredPhrase
                    } else {
                        beginIndex += 1;
                        currentIndex = 0;
                    }
                }
            })

            if (phraseCovered.length > 0) {
                hitCount = 0;
            }

            return {
                action: a,
                confidence: (hitCount * 100) / parts.length
            };

        }
        const deepSearch = (a: Action, phrase: string, appender: (a: any) => void): void => {
            const result = hitByPhrase(phrase, a)
            if (result.confidence > 0 && (!a.matchesContext || a.matchesContext(this.dataSource.context))) {
                appender(result);
            }

            if (a.leafs) {
                a.leafs.forEach(a => deepSearch(a, phrase, appender))
            }
        }

        let results: SearchResult[] = [];
        const appender = (searchResult: SearchResult) => {
            if (searchResult.action.isSearchable) {
                results.push(searchResult);
            }
        }
        this.flatActions.forEach(fa => { deepSearch(fa, phrase, appender) })
        results = results.sort((p, n) => {
            return -1 * (p.confidence - n.confidence)
        })

        return results.map(r => r.action);
    }

    findActionByFlatName(flatName: string): Action {
        const action = this.flatActions.find(fa => {
            return fa.name == flatName;
        })

        return action;
    }

}
