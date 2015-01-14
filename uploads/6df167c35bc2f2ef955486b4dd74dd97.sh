#! /bin/bash
set -x

BRANCH=$1
BUILD_DIR=$PWD

if [[ "$BRANCH" == "" ]]; then
	echo "Provide branch name:"
	echo "b5_0"
	echo "b6_0"
	echo "b7_0"
	echo "HEAD"
	exit 0
fi

datestring=$(date +"%Y%m%d")
pkg="pkgs."$datestring


case $BRANCH in
	b5_0 ) echo "*********** Downloading b5_0 build ***********"	          
		 pkgname="MarkLogic-5.0-"$datestring".x86_64.dmg"
		 rm $BUILD_DIR/$pkgname
		 scp builder@rh54-intel64-43-build:/space/builder/builds/packages/b5_0/$pkg/$pkgname  $BUILD_DIR
	   if [[ -f $BUILD_DIR/$pkgname ]]; then
		   echo "Package path is "$BUILD_DIR/$pkgname
	   else
		   echo "Package could not be downloaded"
		    exit 0
	   fi
		;;
	b6_0 ) echo "*********** Downloading b6_0 build ***********"
	           pkgname="MarkLogic-6.0-"$datestring".x86_64.dmg"
		   rm $BUILD_DIR/$pkgname		 
	           scp builder@rh5-intel64-51-build:/space/builder/builds/packages/b6_0/$pkg/$pkgname  $BUILD_DIR
			   if [[ -f $BUILD_DIR/$pkgname ]]; then
				   echo "Package path is "$BUILD_DIR/$pkgname
			   else
				   echo "Package could not be downloaded"
				    exit 0
			   fi
		  ;;
	b7_0 ) echo "*********** Downloading b7_0 build ***********"
                   pkgname="MarkLogic-7.0-"$datestring".x86_64.dmg"
                   rm $BUILD_DIR/$pkgname
                   scp builder@rh5-intel64-70-build:/space/builder/builds/packages/b7_0/$pkg/$pkgname  $BUILD_DIR
				   if [[ -f $BUILD_DIR/$pkgname ]]; then
					   echo "Package path is "$BUILD_DIR/$pkgname
				   else
					   echo "Package could not be downloaded"
					    exit 0
				   fi
                  ;;
	HEAD ) echo "*********** Downloading HEAD build ***********"
	       pkgname="MarkLogic-8.0-"$datestring".x86_64.dmg"
		   rm $BUILD_DIR/$pkgname	 
		   scp builder@osx-intel64-80-build.marklogic.com:/space/builder/builds/packages/HEAD/$pkg/$pkgname  $BUILD_DIR
		   if [[ -f $BUILD_DIR/$pkgname ]]; then
			   echo "Package path is "$BUILD_DIR/$pkgname
		   else
			   echo "Package could not be downloaded"
			   exit 0
		   fi
		  
		   ;;
	* ) echo "Invalid branch name" 
		echo "Valid branch names are:"
		echo "b5_0"
		echo "b6_0"
		echo "b7_0"
		echo "HEAD"
       		exit 0
	;;
esac