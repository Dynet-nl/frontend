import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const BuildingsList = ({ buildings }) => {
  // useEffect(() => {
  //   console.log('at the end')
  // }, [])
  return (
    <>
      {buildings &&
        buildings.map((building, index) => {
          return (
            <Link key={index} to={`/building/${building._id}`}>
              <div className="buildingContainer">
                <h2>{building.address}</h2>
                {building?.flats
                  ?.sort((a, b) => {
                    const myRegex = /^[A-Za-z]+$/
                    // checking if the flats are alphabetical
                    if (
                      myRegex.test(a.toevoeging) &&
                      myRegex.test(b.toevoeging)
                    ) {
                      // we need to set flats in reversed alphabetically
                      // example:
                      // C
                      // B
                      // A
                      const textA = a.toevoeging
                      const textB = b.toevoeging
                      return textA > textB ? -1 : textA > textB ? 1 : 0
                    } else {
                      // we need to set flats in descending order
                      // example:
                      // 3
                      // 2
                      // H
                      return b.toevoeging - a.toevoeging
                    }
                  })
                  ?.map((apartment, index) => {
                    // return <Apartment key={index} apartment={apartment} />
                    return <div key={index}>flat</div>
                  })}
              </div>
            </Link>
          )
        })}
    </>
  )
}

export default BuildingsList
