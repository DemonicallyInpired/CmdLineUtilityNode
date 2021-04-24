# CmdLineUtilityNode
A basic Command Line Utility to automate readily used POSIX like operations wirtten in Java Script and implemented in Node.js

Let's start by changing the default executable bit of the utilities.js file to 1
> chmod u+x utilities.js

You can now use utilities.js to do various POSIX based task from the Unix terminal or CLI.

A detailed list of operations that can be performed is listed below:

# utilities.js usage
<div class = "highlight highlight-source-css">
  
  <pre>
       utilities.js --help
       utilites.js --printfilepath
       utilities.js --readFileSync
       utilities.js --readFileAsync
       utilities.js --readStreams
       utilities.js --out
       cat {FILENAME} | ./utilities.js --in or -
       cat {FILENAME} | ./utilities.js --streamin
       utilities.js --readStreams --out --compress
       cat {FILENAME} | ./utilities.js --streamin --compress
       cat {FILENAME} | ./utilities.js --instreams --uncompress
       utlities.js --start_server
       utilities.js --start_server_with_express
       utilities.js --spin_childprocess
       utilities.js --others
--help                       print the help
--printfilepath={FILENAME}   print the files relative and absolute path
--readFileSync={FILENAME}    print the content of the file Synchronously
--readFileAsync={FILENAME}   process file Asynchronously
--readStreams={FILENAME}     process Streams of input a chuck at a time, where each chunk constitutes for about 16,384 bytes of data.
--in, -                      process stdin though the console
--streamin                   inputing the stream through console
--out                        print the stdout
--compress                   gzip the output
--uncompress                 uncompress the gzipped file
--others                     process the database
--start_server               Start the File server
--start_server_with_express  Start the Express Server
--spin_childprocess          Spin mutliple child processes to check the load on the server
  </pre>
</div>
