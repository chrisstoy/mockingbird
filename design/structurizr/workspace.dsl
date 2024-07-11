workspace {

    model {
        shopper = person "Shopper" "A person that creates and uses shopping lists"
        admin = person "Admin" "An administrator of the systyem"

        authSystem = softwareSystem "Remote Authentication System"

        shopn = softwareSystem "The Shop'N Grocery List" {
            database = container "Database" "Holds all data for the system" {
              component SQL
            }

            webServer = container "Web Server" "Hosts Web applications" {
              restAPI = component RESTAPI "Provide a REST API for interacting with system"

            }

            adminApp = container AdminApp "Web based application for managing data and users" {
                usersManager = component UserManager "Manage set of Users"
                storesManager = component StoreManager "Manage set of Stores"
                productsManager = component ProductManager "Manage set of Products"
                listsManager = component ListsManager "Manage set of Shopping Lists"
            }


            mobileApp = container MobileApp "Mobile application for user interaction with shopping lists" {
              login = component Login "Sign in a user"
              shoppingListsManager = component ShoppingListsManager "Manage list of shopping lists for this user"
              shoppingList = component ShoppingList
            }
        }

        // Administration application
        shopper -> shopn "Uses"
        admin -> shopn "Uses"
        shopn -> authSystem "Uses for authenticating a User"

        webServer -> adminApp "Serves SPA application"


        adminApp -> authSystem "Makes API calls to"


        // Mobile application
        mobileApp -> authSystem "Makes API calls to"
        mobileApp -> restAPI
        mobileApp -> authSystem
    }

    views {
        systemContext shopn "ShopN" {
            include *
            autoLayout
        }

        container shopn {
            include *
            autoLayout
        }

        component adminApp {
            include *
            autoLayout
        }

        component mobileApp {
            include *
            autoLayout
        }


        theme default

        styles {

            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }

            element "External" {
                background #999999
                color #ffffff
            }

           element "Database" {
                shape Cylinder
            }

            element "Browser" {
                shape WebBrowser
            }
        }
    }

}
