import React from 'react'
import DoubleNoBGs from '../dynamicSchemas/DoubleNoBGs'
import DoubleNoRightBG from '../dynamicSchemas/DoubleNoRightBG'
import FlatsNoStairs from '../dynamicSchemas/FlatsNoStairs'
import LeftFlatsNoBGStairs from '../dynamicSchemas/LeftFlatsNoBGStairs'
import LeftFlatsStairs from '../dynamicSchemas/LeftFlatsStairs'
import RightFlatsNoBGStairs from '../dynamicSchemas/RightFlatsNoBGStairs'
import RightFlatsStairs from '../dynamicSchemas/RightFlatsStairs'
import DoubleNoLeftBG from '../dynamicSchemas/DoubleNoLeftBG'
import LeftStraightFlats from '../dynamicSchemas/LeftStraightFlats'
import RightStraightFlats from '../dynamicSchemas/RightStraightFlats'
import LeftFlatApart from '../dynamicSchemas/LeftFlatApart'
import RightFlatApart from '../dynamicSchemas/RightFlatApart'

const ConditionalFullSchema = ({
  form,
  building,
  parentIndex,
  formFields,
  handleFlatDetails,
}) => {
  if (form.blockType == 'leftWing') {
    return (
      <LeftFlatsStairs
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }
  if (form.blockType == 'noStairs') {
    return (
      <FlatsNoStairs
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }
  if (form.blockType == 'rightWing') {
    return (
      <RightFlatsStairs
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }

  if (form.blockType == 'leftWingApart') {
    return (
      <LeftFlatApart
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }

  if (form.blockType == 'rightWingApart') {
    return (
      <RightFlatApart
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }

  if (form.blockType == 'leftWingNoBG') {
    return (
      <LeftFlatsNoBGStairs
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }

  if (form.blockType == 'rightWingNoBG') {
    return (
      <RightFlatsNoBGStairs
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }
  if (form.blockType == 'doubleNoBGsWing') {
    return (
      <DoubleNoBGs
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }
  if (form.blockType == 'doubleNoRightBGWing') {
    return (
      <DoubleNoRightBG
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }
  if (form.blockType == 'doubleNoLeftBGWing') {
    return (
      <DoubleNoLeftBG
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }

  if (form.blockType == 'leftWingFlat') {
    return (
      <LeftStraightFlats
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }

  if (form.blockType == 'rightWingFlat') {
    return (
      <RightStraightFlats
        form={form}
        building={building}
        parentIndex={parentIndex}
        formFields={formFields}
        handleFlatDetails={handleFlatDetails}
      />
    )
  }
}

export default ConditionalFullSchema
