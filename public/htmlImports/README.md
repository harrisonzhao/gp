HTML imports for important dependencies such as jquery, jquery-ui, etc.
With HTML imports, it prevents the inclusion of jquery multiple times
including the following line will insure that jquery is included once
<link rel="import" href="/htmlImports/dependencies/jquery.html">

dependencies is a directory for all external javascript (such as async, jquery, isotope, etc)

dependencies:
async
isotope - v2
jquery - 1.11.1.min
jquery-ui - 1.10.4.custom