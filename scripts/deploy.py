from brownie import Election, accounts, network

def main():
    # requires brownie account to have been created
    if network.show_active()=='development':
        # add these accounts to metamask by importing private key
        owner = accounts[0]
        Election.deploy({'from': owner})

    elif network.show_active() == 'kovan':
        # add these accounts to metamask by importing private key
        owner = accounts.load('main')
        Election.deploy({'from': owner})
