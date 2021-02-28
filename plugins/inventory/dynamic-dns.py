###############################################################################
# Dynamic DNS inventory script for Ansible
# Matt Keeler (http://keeler.org)
# Based upon Remie Bolte's Node.js script to the same purpose
# (https://medium.com/@remie/using-dns-as-an-ansible-dynamic-inventory-e65a2ed6bc9#.wjoahpbd0)
#
# DEPENDENCY: The dnspython library, install with `pip install dnspython`
#
# This Python script generates a dynamic inventory from specially formatted
# DNS TXT records. Output is in JSON.
#
# It works by querying the specified domain for any TXT records matching two
# types of strings. The first specifies a hostname and any groups that host
# belongs to, using the following format:
#
#     "hostname=tomcat.example.com;groups=tomcat,webserver,texas"
#
# The second specifies any group_vars for a given group:
#
#     "group=webserver;vars=foo_var:foo,bar_var:bar"
#
# You can optionally specify host_vars on a hostname line:
#
#     "hostname=mysql.example.com;hostvars=foo_var:foo,bar_var:bar"
#     "hostname=lab7.example.com;groups=lab;hostvars=foo_var:foo"
#
# Some things to keep in mind:
# - In an inventory, host_vars take precedence over group_vars.
# - Strings in TXT records are limited to 255 characters, but an individual
#   record can be composed of multiple strings separated by double quotation
#   marks. Multiple strings are treated as if they are concatenated together.
#   (See RFC 4408 and RFC 1035 for technical details.) So a TXT record like
#       "group=db;vars=ansible_port:22" ",bar_var:bar"
#   will be read as
#       group=db;vars=ansible_port:22,bar_var:bar
# - DNS propagation can take time, as determined by a record's TTL value.
# - Do not to list sensitive information in TXT records.
# - You can get a listing of TXT records with: 'dig +short -t TXT example.com'
###############################################################################
from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

import os
import dns.resolver

from ansible.errors import AnsibleError, AnsibleParserError
from ansible.module_utils._text import to_bytes, to_native, to_text
from ansible.parsing.utils.addresses import parse_address
from ansible.plugins.inventory import BaseInventoryPlugin


class InventoryModule(BaseInventoryPlugin):

    NAME = "brennanfee.collection.dynamic_dns"

    def verify_file(self, domain):

        valid = False
        records = dns.resolver.resolve(domain, 'TXT', search=True)
