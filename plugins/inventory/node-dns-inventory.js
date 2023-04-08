#!/usr/bin/env node
// From article: https://medium.com/@remie/using-dns-as-an-ansible-dynamic-inventory-e65a2ed6bc9
//
// I modified the code from the article to no longer require external NPM packages.
//
//###########################################################################################
//# Dynamic inventory for Ansible with DNS
//# Author Remie Bolte (https://nl.linkedin.com/in/remiebolte)
//#
//# This NodeJS script generates a dynamic inventory based on DNS TXT records.
//#
//# If you use the “--inventory” switch when calling Ansible, you can provide the
//# path to a directory which includes inventory files. Ansible will automatically
//# run any executable script in that directory to see if provides the JSON output
//# describing a dynamic inventory.
//#
//# Using the following NodeJS script, you can read the information from your TXT
//# record and provide the JSON output that Ansible requires.
//#
//# This script will query the DNS server for the value of the TXT record associated
//# with “host._ansible.yourdomain.com”.
//#
//# It expects to retrieve a string-based value of:
//# “hostname=web-host-01.yourdomain.com;groups=webserver,boston”
//#
//# The second TXT record might be:
//# “hostname=db-host-01.yourdomain.com;groups=database,atlanta”
//#
//# The script will parse these TXT records and output the following JSON:
//# { “webserver”: { “hosts”: [ “web-host-01.yourdomain.com” ] }, “boston”: { “hosts”: [ “web-host-01.yourdomain.com” ] }, “database”: { “hosts”: [ “db-host-01.yourdomain.com” ] }, “atlanta”: { “hosts”: [ “db-host-01.yourdomain.com” ] }
//#
//# Now you only need to create a script that updates your DNS when provisioning or
//# decommissioning a server, by either adding or removing the TXT record for that
//# specific host.
//#
//# TODO:
//# - Add host variables
//# - Add encryption/decryption of TXT record metadata
//#
//# Copyright (c) 2016 Remie Bolte
//# This snippet is license with the MIT open source license
//# https://opensource.org/licenses/MIT
//#
//# Permission is hereby granted, free of charge, to any person obtaining a copy of
//# this software and associated documentation files (the "Software"), to deal in the
//# Software without restriction, including without limitation the rights to use, copy,
//# modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
//# and to permit persons to whom the Software is furnished to do so, subject to the
//# following conditions:
//#
//# The above copyright notice and this permission notice shall be included in all copies
//# or substantial portions of the Software.
//#
//# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
//# CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
//# OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//#
//###########################################################################################

// ---------------------------------------------------------------- Dependencies

var dns = require('dns');

// ------------------------------------------------------------------- Variables

// Replace the domain in this variable with your DNS domain name.  However, this
// only servers as the default.  The user can use the ANSIBLE_INVENTORY_DNS_DOMAIN
// environment variable to override this domain name.
var theDomain = '_ansible.<yourdomain.com>';

// ------------------------------------------------------------------- Functions

function generateDynamicInventoryFromDNS(domain) {
  // Retrieve TXT records from DNS
  dns.resolveTxt(domain, function (error, records) {
    // Variable that will contain the inventory
    var inventory = {};

    if (!records) {
      console.log("Unable to read domain TXT records. Domain: " + domain)
      return
    }

    // Iterate over TXT records
    records.forEach(function(record) {

      // Find each key/value pair in TXT record
      var data = record[0].split(';');

      // temporary object to store key/value pairs
      var store = Array();

      data.forEach(function(items) {
        // Parse key/value pair and store them in temporary object
        var item = items.split("=");
        var key=item[0];
        var value=item[1];
        store[key] = value;
      });

      // Check if this host has groups or is ungrouped
      if (store.hasOwnProperty('groups')) {
        // Iterate over the groups this host is assigned to
        var theGroups = store['groups'].split(',')
        theGroups.forEach(function(group) {
          // Initialize group if it does not already exist
          if (!inventory.hasOwnProperty(group)) {
            inventory[group] = {}
            inventory[group]['hosts'] = Array();
          };

          // Add host to inventory (unless it exists)
          if (!inventory[group]['hosts'].includes(store['hostname'])) {
            inventory[group]['hosts'].push(store['hostname']);
          }
        });
      } else {
        // Host is ungrouped
        // Initialize ungrouped section if it does not already exist
        if (!inventory.hasOwnProperty('ungrouped')) {
          inventory['ungrouped'] = {};
          inventory['ungrouped']['hosts'] = Array();
        }

        // Add host to inventory (unless it exists)
        if (!inventory['ungrouped']['hosts'].includes(store['hostname'])) {
          inventory['ungrouped']['hosts'].push(store['hostname']);
        }
      };
    });

    //return inventory;
    console.log(JSON.stringify(inventory))
  });
};

function showHelp(reason) {
  if (reason) {
    console.log(reason)
    console.log()
  }

  console.log("Usage: node-dns-inventory [options]")
  console.log()
  console.log("Options:")
  console.log("  -l, --list             JSON list of sections/hosts")
  console.log("  -h, --host [hostname]  retrieve variables for specified host (not supported)")
  console.log("  --help                 display help for command")
  console.log()
}

// ------------------------------------------------------------------------ Main

function main() {
  // Process inputs
  const list = process.argv.indexOf('-l') > -1 || process.argv.indexOf('--list') > -1
  const host = process.argv.indexOf('-h') > -1 || process.argv.indexOf('--host') > -1
  const help = process.argv.indexOf('--help') > -1

  if (process.env.ANSIBLE_INVENTORY_DNS_DOMAIN) {
    theDomain = process.env.ANSIBLE_INVENTORY_DNS_DOMAIN;
  }

  if (help) {
    showHelp("")
  } else if (list) {
    generateDynamicInventoryFromDNS(theDomain)
  } else if (host) {
    showHelp("Specific host retrieval is not supported")
  } else {
    showHelp("Invalid or no parameters were passed in.")
  }
}

main()
